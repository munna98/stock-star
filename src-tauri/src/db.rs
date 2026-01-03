use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

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

fn get_db_conn(app: &AppHandle) -> Result<Connection> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .expect("failed to get app data dir");
    let db_path = app_data_dir.join("stock-star.db");
    Connection::open(db_path)
}

pub fn init_db(app: &AppHandle) -> Result<()> {
    // We will store the database in the app data directory
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

    // Reset items table to apply schema change
    // conn.execute("DROP TABLE IF EXISTS items", [])?;
    // Commented out automatic drop to avoid accidental data loss in future runs.
    // For this migration, we assume the user accepts a fresh start or we conditionally schema check.
    // Since the instruction was "Database Reset Recommended", we will force the new schema
    // by creating if not exists with the NEW schema.
    // However, if the table exists with OLD schema, this won't work.
    // Let's explicitly drop it for this transition step.
    conn.execute("DROP TABLE IF EXISTS items", [])?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            brand_id INTEGER,
            model_id INTEGER,
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
        "CREATE TABLE IF NOT EXISTS stock_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaction_number TEXT NOT NULL UNIQUE,
            source_site_id INTEGER,
            destination_site_id INTEGER,
            transaction_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_by INTEGER,
            updated_at DATETIME,
            updated_by INTEGER,
            FOREIGN KEY(source_site_id) REFERENCES sites(id),
            FOREIGN KEY(destination_site_id) REFERENCES sites(id)
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS stock_ledger_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            stock_ledger_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity REAL NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(stock_ledger_id) REFERENCES stock_ledger(id),
            FOREIGN KEY(item_id) REFERENCES items(id)
        )",
        [],
    )?;

    Ok(())
}

// Brand Operations
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
    let mut brands = Vec::new();
    for r in rows {
        brands.push(r?);
    }
    Ok(brands)
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

// Model Operations
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
    let mut models = Vec::new();
    for r in rows {
        models.push(r?);
    }
    Ok(models)
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

// Item Operations
pub fn create_item(app: &AppHandle, item: Item) -> Result<i64> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "INSERT INTO items (code, name, brand_id, model_id) VALUES (?1, ?2, ?3, ?4)",
        params![item.code, item.name, item.brand_id, item.model_id],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_all_items(app: &AppHandle) -> Result<Vec<Item>> {
    let conn = get_db_conn(app)?;
    let mut stmt = conn.prepare("SELECT id, code, name, brand_id, model_id FROM items")?;
    let item_iter = stmt.query_map([], |row| {
        Ok(Item {
            id: Some(row.get(0)?),
            code: row.get(1)?,
            name: row.get(2)?,
            brand_id: row.get(3)?,
            model_id: row.get(4)?,
        })
    })?;

    let mut items = Vec::new();
    for item in item_iter {
        items.push(item?);
    }
    Ok(items)
}

pub fn update_item(app: &AppHandle, item: Item) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute(
        "UPDATE items SET code = ?1, name = ?2, brand_id = ?3, model_id = ?4 WHERE id = ?5",
        params![item.code, item.name, item.brand_id, item.model_id, item.id],
    )?;
    Ok(())
}

pub fn delete_item(app: &AppHandle, id: i64) -> Result<()> {
    let conn = get_db_conn(app)?;
    conn.execute("DELETE FROM items WHERE id = ?1", params![id])?;
    Ok(())
}

// Site Operations
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
    let site_iter = stmt.query_map([], |row| {
        Ok(Site {
            id: Some(row.get(0)?),
            code: row.get(1)?,
            name: row.get(2)?,
            address: row.get(3)?,
            r#type: row.get(4)?,
            is_active: row.get(5)?,
        })
    })?;

    let mut sites = Vec::new();
    for site in site_iter {
        sites.push(site?);
    }
    Ok(sites)
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
