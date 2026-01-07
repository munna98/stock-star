use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

// ============================================================================
// Data Models
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct Brand {
    pub id: Option<i64>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Model {
    pub id: Option<i64>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Item {
    pub id: Option<i64>,
    pub code: String,
    pub name: String,
    pub brand_id: Option<i64>,
    pub model_id: Option<i64>,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Site {
    pub id: Option<i64>,
    pub code: String,
    pub name: String,
    pub address: Option<String>,
    pub r#type: String,
    pub is_active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryTransactionType {
    pub id: Option<i64>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryVoucher {
    pub id: Option<i64>,
    pub transaction_number: Option<String>,
    pub voucher_date: String,
    pub source_site_id: Option<i64>,
    pub destination_site_id: Option<i64>,
    pub voucher_type_id: i64,
    pub items: Vec<InventoryVoucherItem>,
    pub remarks: Option<String>,
    pub created_at: Option<String>,
    pub created_by: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryVoucherItem {
    pub id: Option<i64>,
    pub inventory_voucher_id: Option<i64>,
    pub item_id: i64,
    pub quantity: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PaginatedResponse<T> {
    pub items: Vec<T>,
    pub total_count: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryVoucherDisplay {
    pub id: i64,
    pub transaction_number: String,
    pub voucher_date: String,
    pub source_site_id: Option<i64>,
    pub source_site_name: Option<String>,
    pub destination_site_id: Option<i64>,
    pub destination_site_name: Option<String>,
    pub voucher_type_id: i64,
    pub voucher_type_name: String,
    pub remarks: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockMovement {
    pub id: Option<i64>,
    pub voucher_id: i64,
    pub voucher_item_id: i64,
    pub item_id: i64,
    pub site_id: i64,
    pub stock_in: f64,
    pub stock_out: f64,
    pub created_at: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockBalance {
    pub item_id: i64,
    pub item_code: String,
    pub item_name: String,
    pub brand_name: Option<String>,
    pub model_name: Option<String>,
    pub site_id: i64,
    pub site_code: String,
    pub site_name: String,
    pub site_type: String,
    pub balance: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StockMovementHistory {
    pub id: i64,
    pub voucher_id: i64,
    pub transaction_number: String,
    pub voucher_date: String,
    pub voucher_type_name: String,
    pub item_id: i64,
    pub item_code: String,
    pub item_name: String,
    pub site_id: i64,
    pub site_code: String,
    pub site_name: String,
    pub stock_in: f64,
    pub stock_out: f64,
    pub running_balance: f64,
    pub remarks: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub active_items_count: i64,
    pub active_sites_count: i64,
    pub recent_transactions_count: i64,
}

// ============================================================================
// Database Connection
// ============================================================================

fn get_db_conn(app: &AppHandle) -> Result<Connection> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    let db_path = app_data_dir.join("stock-star.db");
    Connection::open(db_path)
}

// ============================================================================
// Database Initialization
// ============================================================================

pub fn init_db(app: &AppHandle) -> Result<()> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");

    if !app_data_dir.exists() {
        std::fs::create_dir_all(&app_data_dir).expect("failed to create app data dir");
    }

    let db_path = app_data_dir.join("stock-star.db");
    let conn = Connection::open(db_path)?;

    // Enable foreign keys
    conn.execute("PRAGMA foreign_keys = ON;", [])?;

    // Create tables
    create_tables(&conn)?;

    // Seed initial data
    seed_transaction_types(&conn)?;

    // Migrations
    // Add remarks column to inventory_vouchers if it doesn't exist
    let _ = conn.execute("ALTER TABLE inventory_vouchers ADD COLUMN remarks TEXT", []);
    // Add is_active column to items if it doesn't exist
    let _ = conn.execute(
        "ALTER TABLE items ADD COLUMN is_active BOOLEAN DEFAULT 1",
        [],
    );

    Ok(())
}

fn create_tables(conn: &Connection) -> Result<()> {
    conn.execute(
        "CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            brand_id INTEGER,
            model_id INTEGER,
            is_active BOOLEAN DEFAULT 1,
            FOREIGN KEY(brand_id) REFERENCES brands(id),
            FOREIGN KEY(model_id) REFERENCES models(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            mobile TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS sites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            address TEXT,
            type TEXT NOT NULL,
            is_active BOOLEAN DEFAULT 1
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS inventory_transaction_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS inventory_vouchers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_number TEXT NOT NULL UNIQUE,
            voucher_date TEXT,
            source_site_id INTEGER,
            destination_site_id INTEGER,
            voucher_type_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            updated_at DATETIME,
            updated_by INTEGER,
            FOREIGN KEY(source_site_id) REFERENCES sites(id),
            FOREIGN KEY(destination_site_id) REFERENCES sites(id),
            FOREIGN KEY(voucher_type_id) REFERENCES inventory_transaction_types(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS inventory_voucher_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            inventory_voucher_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(inventory_voucher_id) REFERENCES inventory_vouchers(id),
            FOREIGN KEY(item_id) REFERENCES items(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS stock_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            voucher_id INTEGER NOT NULL,
            voucher_item_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            site_id INTEGER NOT NULL,
            stock_in REAL DEFAULT 0,
            stock_out REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(voucher_id) REFERENCES inventory_vouchers(id),
            FOREIGN KEY(voucher_item_id) REFERENCES inventory_voucher_items(id),
            FOREIGN KEY(item_id) REFERENCES items(id),
            FOREIGN KEY(site_id) REFERENCES sites(id)
        )",
        [],
    )?;

    Ok(())
}

fn seed_transaction_types(conn: &Connection) -> Result<()> {
    let types = [
        "Purchase Inward",
        "Opening Stock",
        "Godown → Site",
        "Site → Godown",
        "Site → Site",
        "Material Usage",
        "Stock Adjustment",
        "Damaged Stock",
    ];
    for t in types {
        // Use INSERT OR IGNORE to be safe, ensuring missing types are added
        conn.execute(
            "INSERT OR IGNORE INTO inventory_transaction_types (name) VALUES (?1)",
            params![t],
        )?;
    }

    Ok(())
}

// ============================================================================
// Brand Operations
// ============================================================================

pub fn create_brand(app: &AppHandle, brand: Brand) -> Result<i64> {
    let conn = get_db_conn(app)?;
    conn.execute("INSERT INTO brands (name) VALUES (?1)", params![brand.name])?;
    Ok(conn.last_insert_rowid())
}

pub fn get_all_brands(app: &AppHandle) -> Result<Vec<Brand>> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare("SELECT id, name FROM brands")?;
    let rows = stmt.query_map([], |row| {
        Ok(Brand {
            id: Some(row.get(0)?),
            name: row.get(1)?,
        })
    })?;
    rows.collect()
}

pub fn update_brand(app: &AppHandle, brand: Brand) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "UPDATE brands SET name = ?1 WHERE id = ?2",
        params![brand.name, brand.id],
    )?;
    Ok(())
}

pub fn delete_brand(app: &AppHandle, id: i64) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute("DELETE FROM brands WHERE id = ?1", params![id])?;
    Ok(())
}

// ============================================================================
// Model Operations
// ============================================================================

pub fn create_model(app: &AppHandle, model: Model) -> Result<i64> {
    let conn = get_db_conn(app)?;
    conn.execute("INSERT INTO models (name) VALUES (?1)", params![model.name])?;
    Ok(conn.last_insert_rowid())
}

pub fn get_all_models(app: &AppHandle) -> Result<Vec<Model>> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare("SELECT id, name FROM models")?;
    let rows = stmt.query_map([], |row| {
        Ok(Model {
            id: Some(row.get(0)?),
            name: row.get(1)?,
        })
    })?;
    rows.collect()
}

pub fn update_model(app: &AppHandle, model: Model) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "UPDATE models SET name = ?1 WHERE id = ?2",
        params![model.name, model.id],
    )?;
    Ok(())
}

pub fn delete_model(app: &AppHandle, id: i64) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute("DELETE FROM models WHERE id = ?1", params![id])?;
    Ok(())
}

// ============================================================================
// Item Operations
// ============================================================================

pub fn create_item(app: &AppHandle, item: Item) -> Result<i64> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "INSERT INTO items (code, name, brand_id, model_id, is_active) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            item.code,
            item.name,
            item.brand_id,
            item.model_id,
            item.is_active
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_all_items(app: &AppHandle) -> Result<Vec<Item>> {
    let conn = get_db_conn(app)?;
    let mut stmt =
        conn.prepare("SELECT id, code, name, brand_id, model_id, is_active FROM items")?;
    let rows = stmt.query_map([], |row| {
        Ok(Item {
            id: Some(row.get(0)?),
            code: row.get(1)?,
            name: row.get(2)?,
            brand_id: row.get(3)?,
            model_id: row.get(4)?,
            is_active: row.get(5).unwrap_or(true), // Handle legacy data
        })
    })?;
    rows.collect()
}

pub fn update_item(app: &AppHandle, item: Item) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "UPDATE items SET code = ?1, name = ?2, brand_id = ?3, model_id = ?4, is_active = ?5 WHERE id = ?6",
        params![
            item.code,
            item.name,
            item.brand_id,
            item.model_id,
            item.is_active,
            item.id
        ],
    )?;
    Ok(())
}

pub fn delete_item(app: &AppHandle, id: i64) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute("DELETE FROM items WHERE id = ?1", params![id])?;
    Ok(())
}

// ============================================================================
// Site Operations
// ============================================================================

pub fn create_site(app: &AppHandle, site: Site) -> Result<i64> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "INSERT INTO sites (code, name, address, type, is_active) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            site.code,
            site.name,
            site.address,
            site.r#type,
            site.is_active
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_all_sites(app: &AppHandle) -> Result<Vec<Site>> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare("SELECT id, code, name, address, type, is_active FROM sites")?;
    let rows = stmt.query_map([], |row| {
        Ok(Site {
            id: Some(row.get(0)?),
            code: row.get(1)?,
            name: row.get(2)?,
            address: row.get(3)?,
            r#type: row.get(4)?,
            is_active: row.get(5)?,
        })
    })?;
    rows.collect()
}

pub fn update_site(app: &AppHandle, site: Site) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "UPDATE sites SET code = ?1, name = ?2, address = ?3, type = ?4, is_active = ?5 WHERE id = ?6",
        params![site.code, site.name, site.address, site.r#type, site.is_active, site.id],
    )?;
    Ok(())
}

pub fn delete_site(app: &AppHandle, id: i64) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute("DELETE FROM sites WHERE id = ?1", params![id])?;
    Ok(())
}

// ============================================================================
// Inventory Transaction Type Operations
// ============================================================================

pub fn get_all_inventory_transaction_types(
    app: &AppHandle,
) -> Result<Vec<InventoryTransactionType>> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare("SELECT id, name FROM inventory_transaction_types")?;
    let rows = stmt.query_map([], |row| {
        Ok(InventoryTransactionType {
            id: Some(row.get(0)?),
            name: row.get(1)?,
        })
    })?;
    rows.collect()
}

// ============================================================================
// Inventory Voucher Operations
// ============================================================================

pub fn create_inventory_voucher(app: &AppHandle, mut voucher: InventoryVoucher) -> Result<i64> {
    let mut conn = get_db_conn(app)?;
    let tx = conn.transaction()?;

    // Generate sequential transaction number
    let next_number: i64 = tx.query_row(
        "SELECT COALESCE(MAX(CAST(transaction_number AS INTEGER)), 0) + 1 FROM inventory_vouchers",
        [],
        |row| row.get(0),
    )?;
    let transaction_number = next_number.to_string();

    // Get transaction type name for movement logic and remarks generation
    let type_name: String = tx.query_row(
        "SELECT name FROM inventory_transaction_types WHERE id = ?1",
        params![voucher.voucher_type_id],
        |row| row.get(0),
    )?;

    // Auto-generate remarks if empty
    if voucher.remarks.is_none() || voucher.remarks.as_ref().unwrap().trim().is_empty() {
        let mut generated_remark = type_name.clone();

        let src_name: Option<String> = if let Some(sid) = voucher.source_site_id {
            tx.query_row("SELECT name FROM sites WHERE id = ?", params![sid], |row| {
                row.get(0)
            })
            .ok()
        } else {
            None
        };

        let dest_name: Option<String> = if let Some(did) = voucher.destination_site_id {
            tx.query_row("SELECT name FROM sites WHERE id = ?", params![did], |row| {
                row.get(0)
            })
            .ok()
        } else {
            None
        };

        match type_name.as_str() {
            "Godown → Site" | "Site → Godown" | "Site → Site" => {
                if let (Some(src), Some(dest)) = (src_name, dest_name) {
                    generated_remark = format!("Transfer: {} -> {}", src, dest);
                }
            }
            "Purchase Inward" => {
                // Keep default or maybe add "Recv at " + dest_name
            }
            _ => {}
        }
        voucher.remarks = Some(generated_remark);
    }

    // Insert Voucher
    tx.execute(
        "INSERT INTO inventory_vouchers (transaction_number, voucher_date, source_site_id, destination_site_id, voucher_type_id, remarks, created_by) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            transaction_number,
            voucher.voucher_date,
            voucher.source_site_id,
            voucher.destination_site_id,
            voucher.voucher_type_id,
            voucher.remarks,
            voucher.created_by
        ],
    )?;
    let voucher_id = tx.last_insert_rowid();
    voucher.id = Some(voucher_id);

    // Insert Items and create Stock Movements
    for item in &voucher.items {
        tx.execute(
            "INSERT INTO inventory_voucher_items (inventory_voucher_id, item_id, quantity) VALUES (?1, ?2, ?3)",
            params![voucher_id, item.item_id, item.quantity],
        )?;
        let voucher_item_id = tx.last_insert_rowid();

        // Create stock movements based on transaction type
        create_stock_movements(&tx, &type_name, &voucher, voucher_item_id, item)?;
    }

    tx.commit()?;
    Ok(voucher_id)
}

fn create_stock_movements(
    tx: &rusqlite::Transaction,
    type_name: &str,
    voucher: &InventoryVoucher,
    voucher_item_id: i64,
    item: &InventoryVoucherItem,
) -> Result<()> {
    let voucher_id = voucher.id.unwrap();

    match type_name {
        "Purchase Inward" | "Opening Stock" => {
            if let Some(dest_id) = voucher.destination_site_id {
                tx.execute(
                    "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_in) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![voucher_id, voucher_item_id, item.item_id, dest_id, item.quantity],
                )?;
            }
        }
        "Godown → Site" | "Site → Godown" | "Site → Site" => {
            // Stock out from source
            if let Some(src_id) = voucher.source_site_id {
                tx.execute(
                    "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_out) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![voucher_id, voucher_item_id, item.item_id, src_id, item.quantity],
                )?;
            }
            // Stock in to destination
            if let Some(dest_id) = voucher.destination_site_id {
                tx.execute(
                    "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_in) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![voucher_id, voucher_item_id, item.item_id, dest_id, item.quantity],
                )?;
            }
        }
        "Material Usage" | "Damaged Stock" => {
            if let Some(src_id) = voucher.source_site_id {
                tx.execute(
                    "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_out) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![voucher_id, voucher_item_id, item.item_id, src_id, item.quantity],
                )?;
            }
        }
        "Stock Adjustment" => {
            // If destination is set, it's an In adjustment
            if let Some(dest_id) = voucher.destination_site_id {
                tx.execute(
                    "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_in) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![voucher_id, voucher_item_id, item.item_id, dest_id, item.quantity],
                )?;
            } else if let Some(src_id) = voucher.source_site_id {
                // If only source is set, it's an Out adjustment
                tx.execute(
                    "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_out) VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![voucher_id, voucher_item_id, item.item_id, src_id, item.quantity],
                )?;
            }
        }
        _ => {} // Unknown type - no movement
    }

    Ok(())
}

pub fn get_inventory_vouchers(
    app: &AppHandle,
    page: i64,
    limit: i64,
) -> Result<PaginatedResponse<InventoryVoucherDisplay>> {
    let conn = get_db_conn(app)?;

    // 1. Get Total Count
    let total_count: i64 =
        conn.query_row("SELECT COUNT(*) FROM inventory_vouchers", [], |row| {
            row.get(0)
        })?;

    // 2. Get Page Items
    let offset = (page - 1) * limit;
    let mut stmt = conn.prepare(
        "SELECT 
            v.id, 
            v.transaction_number, 
            v.voucher_date, 
            v.source_site_id, 
            s.name as source_site_name,
            v.destination_site_id, 
            d.name as destination_site_name,
            v.voucher_type_id,
            t.name as voucher_type_name,
            v.remarks,
            v.created_at
         FROM inventory_vouchers v
         LEFT JOIN sites s ON v.source_site_id = s.id
         LEFT JOIN sites d ON v.destination_site_id = d.id
         JOIN inventory_transaction_types t ON v.voucher_type_id = t.id
         ORDER BY v.created_at DESC
         LIMIT ?1 OFFSET ?2",
    )?;

    let rows = stmt.query_map(params![limit, offset], |row| {
        Ok(InventoryVoucherDisplay {
            id: row.get(0)?,
            transaction_number: row.get(1)?,
            voucher_date: row.get(2).unwrap_or_default(),
            source_site_id: row.get(3)?,
            source_site_name: row.get(4)?,
            destination_site_id: row.get(5)?,
            destination_site_name: row.get(6)?,
            voucher_type_id: row.get(7)?,
            voucher_type_name: row.get(8)?,
            remarks: row.get(9)?,
            created_at: row.get(10).unwrap_or_default(),
        })
    })?;

    let items: Vec<InventoryVoucherDisplay> = rows.collect::<Result<Vec<_>>>()?;

    Ok(PaginatedResponse { items, total_count })
}

pub fn get_inventory_voucher(app: &AppHandle, id: i64) -> Result<InventoryVoucher> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare(
        "SELECT 
            id, 
            transaction_number, 
            voucher_date, 
            source_site_id, 
            destination_site_id, 
            voucher_type_id, 
            remarks, 
            created_by 
         FROM inventory_vouchers 
         WHERE id = ?1",
    )?;

    let voucher = stmt.query_row(params![id], |row| {
        Ok(InventoryVoucher {
            id: Some(row.get(0)?),
            transaction_number: row.get(1)?,
            voucher_date: row.get(2)?,
            source_site_id: row.get(3)?,
            destination_site_id: row.get(4)?,
            voucher_type_id: row.get(5)?,
            items: vec![], // Will populate below
            remarks: row.get(6)?,
            created_at: None, // Not needed for edit
            created_by: row.get(7)?,
        })
    })?;

    // Get Items
    let mut stmt_items = conn.prepare(
        "SELECT item_id, quantity FROM inventory_voucher_items WHERE inventory_voucher_id = ?1",
    )?;

    let items_iter = stmt_items.query_map(params![id], |row| {
        Ok(InventoryVoucherItem {
            id: None,
            inventory_voucher_id: Some(id),
            item_id: row.get(0)?,
            quantity: row.get(1)?,
        })
    })?;

    let mut final_voucher = voucher;
    for item in items_iter {
        final_voucher.items.push(item?);
    }

    Ok(final_voucher)
}

pub fn delete_inventory_voucher(app: &AppHandle, id: i64) -> Result<()> {
    let mut conn = get_db_conn(app)?;
    let tx = conn.transaction()?;

    // 1. Delete Stock Movements
    tx.execute(
        "DELETE FROM stock_movements WHERE voucher_id = ?1",
        params![id],
    )?;

    // 2. Delete Voucher Items
    tx.execute(
        "DELETE FROM inventory_voucher_items WHERE inventory_voucher_id = ?1",
        params![id],
    )?;

    // 3. Delete Voucher
    tx.execute("DELETE FROM inventory_vouchers WHERE id = ?1", params![id])?;

    tx.commit()?;
    Ok(())
}

pub fn update_inventory_voucher(app: &AppHandle, mut voucher: InventoryVoucher) -> Result<()> {
    let mut conn = get_db_conn(app)?;
    let tx = conn.transaction()?;
    let voucher_id = voucher.id.ok_or(rusqlite::Error::QueryReturnedNoRows)?; // Check for ID

    // 1. Check if exists
    // (Optional but good practice)

    // 2. Clear existing items and movements (Simpler than diffing)
    tx.execute(
        "DELETE FROM stock_movements WHERE voucher_id = ?1",
        params![voucher_id],
    )?;
    tx.execute(
        "DELETE FROM inventory_voucher_items WHERE inventory_voucher_id = ?1",
        params![voucher_id],
    )?;

    // 3. Update Voucher Details
    // Re-generate remarks if needed (logic similar to create, or just keep what user sent)
    // Get transaction type name for movement logic and remarks generation
    let type_name: String = tx.query_row(
        "SELECT name FROM inventory_transaction_types WHERE id = ?1",
        params![voucher.voucher_type_id],
        |row| row.get(0),
    )?;

    // If remarks are empty, regenerate them
    if voucher.remarks.is_none() || voucher.remarks.as_ref().unwrap().trim().is_empty() {
        let mut generated_remark = type_name.clone();

        let src_name: Option<String> = if let Some(sid) = voucher.source_site_id {
            tx.query_row("SELECT name FROM sites WHERE id = ?", params![sid], |row| {
                row.get(0)
            })
            .ok()
        } else {
            None
        };

        let dest_name: Option<String> = if let Some(did) = voucher.destination_site_id {
            tx.query_row("SELECT name FROM sites WHERE id = ?", params![did], |row| {
                row.get(0)
            })
            .ok()
        } else {
            None
        };

        match type_name.as_str() {
            "Godown → Site" | "Site → Godown" | "Site → Site" => {
                if let (Some(src), Some(dest)) = (src_name, dest_name) {
                    generated_remark = format!("Transfer: {} -> {}", src, dest);
                }
            }
            _ => {}
        }
        voucher.remarks = Some(generated_remark);
    }

    tx.execute(
        "UPDATE inventory_vouchers 
         SET voucher_date = ?1, source_site_id = ?2, destination_site_id = ?3, voucher_type_id = ?4, remarks = ?5 
         WHERE id = ?6",
        params![
            voucher.voucher_date,
            voucher.source_site_id,
            voucher.destination_site_id,
            voucher.voucher_type_id,
            voucher.remarks,
            voucher_id
        ],
    )?;

    // 4. Re-insert Items and recreate Stock Movements
    for item in &voucher.items {
        tx.execute(
            "INSERT INTO inventory_voucher_items (inventory_voucher_id, item_id, quantity) VALUES (?1, ?2, ?3)",
            params![voucher_id, item.item_id, item.quantity],
        )?;
        let voucher_item_id = tx.last_insert_rowid();

        // Create stock movements based on transaction type
        create_stock_movements(&tx, &type_name, &voucher, voucher_item_id, item)?;
    }

    tx.commit()?;
    Ok(())
}

// ============================================================================
// Stock Balance Operations
// ============================================================================

pub fn get_stock_balance(app: &AppHandle, site_id: i64, item_id: i64) -> Result<f64> {
    let conn = get_db_conn(app)?;
    let balance: f64 = conn.query_row(
        "SELECT COALESCE(SUM(stock_in) - SUM(stock_out), 0) FROM stock_movements WHERE site_id = ?1 AND item_id = ?2",
        params![site_id, item_id],
        |row| row.get(0),
    )?;
    Ok(balance)
}

// Get all stock balances (grouped by item and site)
pub fn get_stock_balances(
    app: &AppHandle,
    item_name: Option<String>,
    site_id: Option<i64>,
    page: i64,
    limit: i64,
) -> Result<PaginatedResponse<StockBalance>> {
    let conn = get_db_conn(app)?;

    let mut where_clauses = vec!["1=1".to_string()];
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![];

    if let Some(name) = &item_name {
        where_clauses.push("i.name LIKE ?".to_string());
        params_vec.push(Box::new(format!("%{}%", name)));
    }

    if let Some(sid) = site_id {
        where_clauses.push("s.id = ?".to_string());
        params_vec.push(Box::new(sid));
    }

    let where_sql = where_clauses.join(" AND ");
    let param_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    // 1. Get Total Count
    let count_query = format!(
        "SELECT COUNT(*) FROM (
            SELECT i.id
            FROM items i
            CROSS JOIN sites s
            LEFT JOIN stock_movements sm ON sm.item_id = i.id AND sm.site_id = s.id
            WHERE {}
            GROUP BY i.id, s.id
            HAVING COALESCE(SUM(sm.stock_in) - SUM(sm.stock_out), 0) != 0
        )",
        where_sql
    );
    let total_count: i64 = conn.query_row(&count_query, &param_refs[..], |row| row.get(0))?;

    // 2. Get Page Items
    let offset = (page - 1) * limit;
    let query = format!(
        "SELECT 
            i.id as item_id,
            i.code as item_code,
            i.name as item_name,
            b.name as brand_name,
            m.name as model_name,
            s.id as site_id,
            s.code as site_code,
            s.name as site_name,
            s.type as site_type,
            COALESCE(SUM(sm.stock_in) - SUM(sm.stock_out), 0) as balance
         FROM items i
         CROSS JOIN sites s
         LEFT JOIN brands b ON i.brand_id = b.id
         LEFT JOIN models m ON i.model_id = m.id
         LEFT JOIN stock_movements sm ON sm.item_id = i.id AND sm.site_id = s.id
         WHERE {}
         GROUP BY i.id, s.id
         HAVING balance != 0
         ORDER BY s.name, i.name
         LIMIT ? OFFSET ?",
        where_sql
    );

    let mut final_params_refs = param_refs.clone();
    final_params_refs.push(&limit);
    final_params_refs.push(&offset);

    let mut stmt = conn.prepare(&query)?;

    let rows = stmt.query_map(&final_params_refs[..], |row| {
        Ok(StockBalance {
            item_id: row.get(0)?,
            item_code: row.get(1)?,
            item_name: row.get(2)?,
            brand_name: row.get(3)?,
            model_name: row.get(4)?,
            site_id: row.get(5)?,
            site_code: row.get(6)?,
            site_name: row.get(7)?,
            site_type: row.get(8)?,
            balance: row.get(9)?,
        })
    })?;

    let items: Vec<StockBalance> = rows.collect::<Result<Vec<_>>>()?;

    Ok(PaginatedResponse { items, total_count })
}

// Get stock balance for specific item across all sites
pub fn get_item_stock_by_sites(app: &AppHandle, item_id: i64) -> Result<Vec<StockBalance>> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare(
        "SELECT 
            i.id as item_id,
            i.code as item_code,
            i.name as item_name,
            b.name as brand_name,
            m.name as model_name,
            s.id as site_id,
            s.code as site_code,
            s.name as site_name,
            s.type as site_type,
            COALESCE(SUM(sm.stock_in) - SUM(sm.stock_out), 0) as balance
         FROM items i
         CROSS JOIN sites s
         LEFT JOIN brands b ON i.brand_id = b.id
         LEFT JOIN models m ON i.model_id = m.id
         LEFT JOIN stock_movements sm ON sm.item_id = i.id AND sm.site_id = s.id
         WHERE i.id = ?1
         GROUP BY s.id
         ORDER BY s.name",
    )?;

    let rows = stmt.query_map(params![item_id], |row| {
        Ok(StockBalance {
            item_id: row.get(0)?,
            item_code: row.get(1)?,
            item_name: row.get(2)?,
            brand_name: row.get(3)?,
            model_name: row.get(4)?,
            site_id: row.get(5)?,
            site_code: row.get(6)?,
            site_name: row.get(7)?,
            site_type: row.get(8)?,
            balance: row.get(9)?,
        })
    })?;

    rows.collect()
}

// Get stock balance for specific site
pub fn get_site_stock_balances(app: &AppHandle, site_id: i64) -> Result<Vec<StockBalance>> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare(
        "SELECT 
            i.id as item_id,
            i.code as item_code,
            i.name as item_name,
            b.name as brand_name,
            m.name as model_name,
            s.id as site_id,
            s.code as site_code,
            s.name as site_name,
            s.type as site_type,
            COALESCE(SUM(sm.stock_in) - SUM(sm.stock_out), 0) as balance
         FROM items i
         CROSS JOIN sites s
         LEFT JOIN brands b ON i.brand_id = b.id
         LEFT JOIN models m ON i.model_id = m.id
         LEFT JOIN stock_movements sm ON sm.item_id = i.id AND sm.site_id = s.id
         WHERE s.id = ?1
         GROUP BY i.id
         HAVING balance != 0
         ORDER BY i.name",
    )?;

    let rows = stmt.query_map(params![site_id], |row| {
        Ok(StockBalance {
            item_id: row.get(0)?,
            item_code: row.get(1)?,
            item_name: row.get(2)?,
            brand_name: row.get(3)?,
            model_name: row.get(4)?,
            site_id: row.get(5)?,
            site_code: row.get(6)?,
            site_name: row.get(7)?,
            site_type: row.get(8)?,
            balance: row.get(9)?,
        })
    })?;

    rows.collect()
}

// ============================================================================
// Stock Movement History Operations
// ============================================================================

pub fn get_stock_movement_history(
    app: &AppHandle,
    item_id: Option<i64>,
    site_id: Option<i64>,
    from_date: Option<String>,
    to_date: Option<String>,
    page: i64,
    limit: i64,
) -> Result<PaginatedResponse<StockMovementHistory>> {
    let conn = get_db_conn(app)?;

    // Base WHERE clause construction
    let mut where_clauses = vec!["1=1".to_string()];
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![];

    if let Some(iid) = item_id {
        where_clauses.push("sm.item_id = ?".to_string());
        params_vec.push(Box::new(iid));
    }

    if let Some(sid) = site_id {
        where_clauses.push("sm.site_id = ?".to_string());
        params_vec.push(Box::new(sid));
    }

    if let Some(fd) = &from_date {
        where_clauses.push("v.voucher_date >= ?".to_string());
        params_vec.push(Box::new(fd));
    }

    if let Some(td) = &to_date {
        where_clauses.push("v.voucher_date <= ?".to_string());
        params_vec.push(Box::new(td));
    }

    let where_sql = where_clauses.join(" AND ");
    let param_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    // 1. Get Total Count
    let count_query = format!(
        "SELECT COUNT(*) 
         FROM stock_movements sm
         JOIN inventory_vouchers v ON sm.voucher_id = v.id
         WHERE {}",
        where_sql
    );
    let total_count: i64 = conn.query_row(&count_query, &param_refs[..], |row| row.get(0))?;

    // 2. Calculate Opening Balance (if item is selected)
    let mut current_balance = 0.0;

    // 2a. Initial Opening Balance (before from_date)
    if let (Some(iid), Some(fd)) = (item_id, &from_date) {
        let mut balance_query = String::from(
            "SELECT COALESCE(SUM(sm.stock_in) - SUM(sm.stock_out), 0)
             FROM stock_movements sm
             JOIN inventory_vouchers v ON sm.voucher_id = v.id
             WHERE sm.item_id = ? AND v.voucher_date < ?",
        );
        let mut balance_params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(iid), Box::new(fd)];

        if let Some(sid) = site_id {
            balance_query.push_str(" AND sm.site_id = ?");
            balance_params.push(Box::new(sid));
        }

        let b_param_refs: Vec<&dyn rusqlite::ToSql> =
            balance_params.iter().map(|p| p.as_ref()).collect();
        let initial_opening: f64 = conn
            .query_row(&balance_query, &b_param_refs[..], |row| row.get(0))
            .unwrap_or(0.0);
        current_balance += initial_opening;
    }

    // 2b. Add skipped rows balance (for pagination > page 1)
    let offset = (page - 1) * limit;
    if offset > 0 && item_id.is_some() {
        // We need to sum stock_in - stock_out for the rows that are skipped by OFFSET
        // To do this reliably, we must use the exact same ORDER BY as the main query
        // This is complex in SQLite without window functions or a subquery with LIMIT

        let skipped_balance_query = format!(
            "SELECT COALESCE(SUM(sub.stock_in) - SUM(sub.stock_out), 0) FROM (
                 SELECT sm.stock_in, sm.stock_out
                 FROM stock_movements sm
                 JOIN inventory_vouchers v ON sm.voucher_id = v.id
                 WHERE {}
                 ORDER BY v.voucher_date ASC, sm.created_at ASC
                 LIMIT ?
            ) sub",
            where_sql
        );

        // Add limit to params
        let mut skipped_params_refs = param_refs.clone();
        let offset_val = offset; // Move to own var to borrow
        skipped_params_refs.push(&offset_val);

        let skipped_balance: f64 = conn
            .query_row(&skipped_balance_query, &skipped_params_refs[..], |row| {
                row.get(0)
            })
            .unwrap_or(0.0);

        current_balance += skipped_balance;
    }

    // 3. Fetch Page Items
    let query = format!(
        "SELECT 
            sm.id,
            sm.voucher_id,
            v.transaction_number,
            v.voucher_date,
            t.name as voucher_type_name,
            sm.item_id,
            i.code as item_code,
            i.name as item_name,
            sm.site_id,
            s.code as site_code,
            s.name as site_name,
            sm.stock_in,
            sm.stock_out,
            v.remarks,
            sm.created_at
         FROM stock_movements sm
         JOIN inventory_vouchers v ON sm.voucher_id = v.id
         JOIN inventory_transaction_types t ON v.voucher_type_id = t.id
         JOIN items i ON sm.item_id = i.id
         JOIN sites s ON sm.site_id = s.id
         WHERE {}
         ORDER BY v.voucher_date ASC, sm.created_at ASC
         LIMIT ? OFFSET ?",
        where_sql
    );

    let mut final_params_refs = param_refs.clone();
    final_params_refs.push(&limit);
    final_params_refs.push(&offset);

    let mut stmt = conn.prepare(&query)?;

    let mut movements: Vec<StockMovementHistory> = stmt
        .query_map(&final_params_refs[..], |row| {
            Ok(StockMovementHistory {
                id: row.get(0)?,
                voucher_id: row.get(1)?,
                transaction_number: row.get(2)?,
                voucher_date: row.get(3)?,
                voucher_type_name: row.get(4)?,
                item_id: row.get(5)?,
                item_code: row.get(6)?,
                item_name: row.get(7)?,
                site_id: row.get(8)?,
                site_code: row.get(9)?,
                site_name: row.get(10)?,
                stock_in: row.get(11)?,
                stock_out: row.get(12)?,
                remarks: row.get(13)?,
                running_balance: 0.0, // Will calculate below
                created_at: row.get(14)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    // 4. Calculate Running Balance for the page
    if item_id.is_some() {
        for movement in &mut movements {
            current_balance += movement.stock_in - movement.stock_out;
            movement.running_balance = current_balance;
        }
    } else {
        // If multiple items, running balance is meaningless
        for movement in &mut movements {
            movement.running_balance = 0.0;
        }
    }

    Ok(PaginatedResponse {
        items: movements,
        total_count,
    })
}

// ============================================================================
// Dashboard Stats
// ============================================================================

pub fn get_dashboard_stats(app: &AppHandle) -> Result<DashboardStats> {
    let conn = get_db_conn(app)?;

    // Count active items
    let active_items_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM items WHERE is_active = 1",
        [],
        |row| row.get(0),
    )?;

    // Count active sites
    let active_sites_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM sites WHERE is_active = 1",
        [],
        |row| row.get(0),
    )?;

    // Count transactions in last 7 days
    let recent_transactions_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM inventory_vouchers WHERE voucher_date >= date('now', '-7 days')",
        [],
        |row| row.get(0),
    )?;

    Ok(DashboardStats {
        active_items_count,
        active_sites_count,
        recent_transactions_count,
    })
}
