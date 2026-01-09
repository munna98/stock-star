use crate::db::get_db_conn;
use base64::{engine::general_purpose, Engine as _};
use chrono::{DateTime, Duration, Utc};
use hmac::{Hmac, Mac};
use machine_uid::get as get_machine_id;
use rusqlite::params;
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use tauri::AppHandle;

// Shared Secret for HMAC-SHA256
// User requested: "public-key-stock-star-2026"
const SHARED_SECRET: &str = "public-key-stock-star-2026";

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Serialize, Deserialize)]
pub struct LicensePayload {
    sub: String,      // "license"
    r#type: String,   // "basic", "premium"
    iat: i64,         // Issued At
    exp: Option<i64>, // Expiration (optional)
    name: Option<String>,
    system_id: Option<String>, // Machine Lock
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(tag = "status", content = "details")]
pub enum LicenseStatus {
    Valid(ValidLicenseDetails),
    Trial(TrialDetails),
    Expired,
    Invalid,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ValidLicenseDetails {
    pub type_: String,
    pub issued_to: Option<String>,
    pub expires_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrialDetails {
    pub hours_remaining: i64,
    pub system_id: String,
}

#[tauri::command]
pub fn get_system_id() -> String {
    get_machine_id().unwrap_or_else(|_| "UNKNOWN-SYSTEM-ID".to_string())
}

#[tauri::command]
pub fn activate_license(app: AppHandle, key: String) -> Result<String, String> {
    // 1. Decode Base64
    let decoded = general_purpose::STANDARD
        .decode(&key)
        .map_err(|_| "Invalid license key format".to_string())?;

    // HMAC-SHA256 signature is 32 bytes
    if decoded.len() < 32 {
        return Err("Invalid license key length".to_string());
    }

    // 2. Split Signature (32 bytes) and Payload
    let (sig_bytes, payload_bytes) = decoded.split_at(32);

    // 3. Verify Signature (HMAC)
    let mut mac = HmacSha256::new_from_slice(SHARED_SECRET.as_bytes())
        .map_err(|_| "Internal error: Invalid secret key".to_string())?;

    mac.update(payload_bytes);

    mac.verify_slice(sig_bytes)
        .map_err(|_| "Invalid license signature".to_string())?;

    // 4. Parse Payload
    let payload: LicensePayload =
        serde_json::from_slice(payload_bytes).map_err(|_| "Invalid license data".to_string())?;

    if payload.sub != "license" {
        return Err("Invalid license type".to_string());
    }

    // 5. Verify System ID (Machine Lock)
    let current_system_id = get_system_id();
    if let Some(ref locked_id) = payload.system_id {
        if locked_id != &current_system_id {
            return Err(format!(
                "This license is locked to another machine (ID: {})",
                locked_id
            ));
        }
    }

    // 6. Check Expiry
    if let Some(exp) = payload.exp {
        let now = Utc::now().timestamp();
        if now > exp {
            return Err("License has expired".to_string());
        }
    }

    // 7. Save to DB
    let conn = get_db_conn(&app).map_err(|e: rusqlite::Error| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO system_metadata (key, value) VALUES ('license_key', ?1)",
        params![key],
    )
    .map_err(|e: rusqlite::Error| e.to_string())?;

    Ok("Activation successful".to_string())
}

#[tauri::command]
pub fn get_license_status(app: AppHandle) -> LicenseStatus {
    let conn = match get_db_conn(&app) {
        Ok(c) => c,
        Err(_) => return LicenseStatus::Invalid,
    };

    // 1. Check for stored license
    let stored_key: Option<String> = conn
        .query_row(
            "SELECT value FROM system_metadata WHERE key = 'license_key'",
            [],
            |row: &rusqlite::Row| row.get(0),
        )
        .ok();

    if let Some(key) = stored_key {
        if let Ok(_) = verify_license_internal(&key) {
            let decoded = general_purpose::STANDARD.decode(&key).unwrap();
            let (_, payload_bytes) = decoded.split_at(32); // 32 bytes for HMAC-SHA256
            let payload: LicensePayload = serde_json::from_slice(payload_bytes).unwrap();

            let expires_at_str = payload.exp.map(|ts| {
                DateTime::from_timestamp(ts, 0)
                    .map(|dt| dt.to_rfc3339())
                    .unwrap_or_default()
            });

            return LicenseStatus::Valid(ValidLicenseDetails {
                type_: payload.r#type,
                issued_to: payload.name,
                expires_at: expires_at_str,
            });
        }
        // If invalid, fall through to trial check
    }

    // 2. Check Trial Status
    check_trial_status(&conn)
}

fn verify_license_internal(key: &str) -> Result<(), ()> {
    let decoded = general_purpose::STANDARD.decode(key).map_err(|_| ())?;
    if decoded.len() < 32 {
        return Err(());
    }

    let (sig_bytes, payload_bytes) = decoded.split_at(32);

    let mut mac = HmacSha256::new_from_slice(SHARED_SECRET.as_bytes()).map_err(|_| ())?;
    mac.update(payload_bytes);
    mac.verify_slice(sig_bytes).map_err(|_| ())?;

    let payload: LicensePayload = serde_json::from_slice(payload_bytes).map_err(|_| ())?;

    // Machine Lock Check inside internal verify
    if let Some(ref locked_id) = payload.system_id {
        if locked_id != &get_system_id() {
            return Err(());
        }
    }

    if let Some(exp) = payload.exp {
        if Utc::now().timestamp() > exp {
            return Err(());
        }
    }

    Ok(())
}

fn check_trial_status(conn: &rusqlite::Connection) -> LicenseStatus {
    let now = Utc::now();
    let current_system_id = get_system_id();

    let first_run: Option<String> = conn
        .query_row(
            "SELECT value FROM system_metadata WHERE key = 'first_run_at'",
            [],
            |row| row.get(0),
        )
        .ok();

    match first_run {
        Some(ts_str) => {
            if let Ok(first_run_ts) = DateTime::parse_from_rfc3339(&ts_str) {
                let first_run_utc = first_run_ts.with_timezone(&Utc);
                // 1 Day Trial
                let expiry = first_run_utc + Duration::days(1);

                if now < expiry {
                    let hours_left = (expiry - now).num_hours();
                    return LicenseStatus::Trial(TrialDetails {
                        hours_remaining: hours_left,
                        system_id: current_system_id,
                    });
                } else {
                    return LicenseStatus::Expired;
                }
            } else {
                return LicenseStatus::Expired;
            }
        }
        None => {
            let now_str = now.to_rfc3339();
            let _ = conn.execute(
                "INSERT INTO system_metadata (key, value) VALUES ('first_run_at', ?1)",
                params![now_str],
            );
            return LicenseStatus::Trial(TrialDetails {
                hours_remaining: 24,
                system_id: current_system_id,
            });
        }
    }
}
