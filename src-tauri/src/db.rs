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

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryTransactionType {
    pub id: Option<i64>,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryVoucher {
    pub id: Option<i64>,
    pub transaction_number: String,
    pub voucher_date: String,
    pub source_site_id: Option<i64>,
    pub destination_site_id: Option<i64>,
    pub voucher_type_id: i64,
    pub items: Vec<InventoryVoucherItem>,
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
        "CREATE TABLE IF NOT EXISTS inventory_transaction_types (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )",
        [],
    )?;

    // Seed transaction types if empty
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM inventory_transaction_types",
        [],
        |row| row.get(0),
    )?;

    if count == 0 {
        let types = vec![
            "Purchase Inward",
            "Godown → Site",
            "Site → Godown",
            "Site → Site",
            "Material Usage",
            "Stock Adjustment",
            "Damaged Stock",
        ];
        for t in types {
            conn.execute(
                "INSERT INTO inventory_transaction_types (name) VALUES (?1)",
                params![t],
            )?;
        }
    }

    // Check for legacy column 'transaction_type' in 'inventory_vouchers'
    let has_transaction_type = {
        let mut stmt = conn.prepare("SELECT name FROM pragma_table_info('inventory_vouchers')")?;
        let columns = stmt.query_map([], |row| row.get::<_, String>(0))?;
        let mut found = false;
        for col in columns {
            if let Ok(name) = col {
                if name.to_lowercase() == "transaction_type" {
                    found = true;
                    break;
                }
            }
        }
        found
    };

    if has_transaction_type {
        println!(">>> [INIT] Legacy column 'transaction_type' detected in 'inventory_vouchers'.");
        println!(">>> [INIT] Starting database migration to modernize schema...");

        // Ensure no previous failed migration tables exist
        let _ = conn.execute("DROP TABLE IF EXISTS old_inventory_vouchers", []);

        // 1. Rename old table
        conn.execute(
            "ALTER TABLE inventory_vouchers RENAME TO old_inventory_vouchers",
            [],
        )?;

        // 2. Create new table with modern schema
        conn.execute(
            "CREATE TABLE inventory_vouchers (
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

        // 3. Migrate data
        println!(">>> [INIT] Moving data to new schema...");

        // Add voucher_type_id to old table if missing for easier mapping
        let old_has_voucher_type_id = {
            let mut stmt =
                conn.prepare("SELECT name FROM pragma_table_info('old_inventory_vouchers')")?;
            let mut cols = stmt.query_map([], |row| row.get::<_, String>(0))?;
            cols.any(|c| {
                c.map(|n| n.to_lowercase() == "voucher_type_id")
                    .unwrap_or(false)
            })
        };

        if !old_has_voucher_type_id {
            let _ = conn.execute(
                "ALTER TABLE old_inventory_vouchers ADD COLUMN voucher_type_id INTEGER",
                [],
            );
        }

        // Map strings to IDs
        let types_mapping = vec![
            ("Purchase Inward", "Purchase"),
            ("Godown → Site", "Transfer"),
            ("Material Usage", "Usage"),
            ("Stock Adjustment", "Adjustment"),
        ];

        for (new_name, old_name) in types_mapping {
            let _ = conn.execute(
                "UPDATE old_inventory_vouchers SET voucher_type_id = (SELECT id FROM inventory_transaction_types WHERE name = ?1) WHERE transaction_type = ?2",
                params![new_name, old_name],
            );
        }

        // Copy everything
        conn.execute(
            "INSERT INTO inventory_vouchers (id, transaction_number, voucher_date, source_site_id, destination_site_id, voucher_type_id, created_at, created_by)
             SELECT id, transaction_number, COALESCE(voucher_date, date('now')), source_site_id, destination_site_id, voucher_type_id, created_at, created_by
             FROM old_inventory_vouchers",
            [],
        )?;

        // 4. Cleanup
        conn.execute("DROP TABLE old_inventory_vouchers", [])?;
        println!(">>> [INIT] Migration successful. Legacy column removed.");
    }

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

// Inventory Transaction Type Operations
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
    let mut types = Vec::new();
    for r in rows {
        types.push(r?);
    }
    Ok(types)
}

// Inventory Voucher Operations
pub fn create_inventory_voucher(app: &AppHandle, mut voucher: InventoryVoucher) -> Result<i64> {
    let mut conn = get_db_conn(app)?;
    let tx = conn.transaction()?;

    // 1. Insert Voucher
    tx.execute(
        "INSERT INTO inventory_vouchers (transaction_number, voucher_date, source_site_id, destination_site_id, voucher_type_id, created_by) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            voucher.transaction_number,
            voucher.voucher_date,
            voucher.source_site_id,
            voucher.destination_site_id,
            voucher.voucher_type_id,
            voucher.created_by
        ],
    )?;
    let voucher_id = tx.last_insert_rowid();
    voucher.id = Some(voucher_id);

    // Get the name of the transaction type to decide movement logic
    let type_name: String = tx.query_row(
        "SELECT name FROM inventory_transaction_types WHERE id = ?1",
        params![voucher.voucher_type_id],
        |row| row.get(0),
    )?;

    // 2. Insert Items and Movements
    for item in &voucher.items {
        tx.execute(
            "INSERT INTO inventory_voucher_items (inventory_voucher_id, item_id, quantity) VALUES (?1, ?2, ?3)",
            params![voucher_id, item.item_id, item.quantity],
        )?;
        let voucher_item_id = tx.last_insert_rowid();

        // Movement Logic
        match type_name.as_str() {
            "Purchase Inward" => {
                if let Some(dest_id) = voucher.destination_site_id {
                    tx.execute(
                        "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_in) VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![voucher_id, voucher_item_id, item.item_id, dest_id, item.quantity],
                    )?;
                }
            }
            "Godown → Site" | "Site → Godown" | "Site → Site" => {
                if let Some(src_id) = voucher.source_site_id {
                    tx.execute(
                        "INSERT INTO stock_movements (voucher_id, voucher_item_id, item_id, site_id, stock_out) VALUES (?1, ?2, ?3, ?4, ?5)",
                        params![voucher_id, voucher_item_id, item.item_id, src_id, item.quantity],
                    )?;
                }
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
            _ => {
                // Default fallback if unknown type
            }
        }
    }

    tx.commit()?;
    Ok(voucher_id)
}

pub fn get_all_inventory_vouchers(app: &AppHandle) -> Result<Vec<InventoryVoucherDisplay>> {
    let conn = get_db_conn(app)?;
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
            v.created_at
         FROM inventory_vouchers v
         LEFT JOIN sites s ON v.source_site_id = s.id
         LEFT JOIN sites d ON v.destination_site_id = d.id
         JOIN inventory_transaction_types t ON v.voucher_type_id = t.id
         ORDER BY v.created_at DESC",
    )?;

    let rows = stmt.query_map([], |row| {
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
            created_at: row.get(9).unwrap_or_default(),
        })
    })?;

    let mut vouchers = Vec::new();
    for r in rows {
        vouchers.push(r?);
    }
    Ok(vouchers)
}

pub fn get_stock_balance(app: &AppHandle, site_id: i64, item_id: i64) -> Result<f64> {
    let conn = get_db_conn(app)?;
    let balance: f64 = conn.query_row(
        "SELECT COALESCE(SUM(stock_in) - SUM(stock_out), 0) FROM stock_movements WHERE site_id = ?1 AND item_id = ?2",
        params![site_id, item_id],
        |row| row.get(0),
    )?;
    Ok(balance)
}
