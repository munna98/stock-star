use crate::db::{
    self, Brand, InventoryTransactionType, InventoryVoucher, InventoryVoucherDisplay, Item, Model,
    Site,
};
use tauri::{command, AppHandle};

// Item Commands
#[command]
pub fn create_item(app: AppHandle, item: Item) -> Result<i64, String> {
    db::create_item(&app, item).map_err(|e| e.to_string())
}

#[command]
pub fn get_items(app: AppHandle) -> Result<Vec<Item>, String> {
    db::get_all_items(&app).map_err(|e| e.to_string())
}

#[command]
pub fn update_item(app: AppHandle, item: Item) -> Result<(), String> {
    db::update_item(&app, item).map_err(|e| e.to_string())
}

#[command]
pub fn delete_item(app: AppHandle, id: i64) -> Result<(), String> {
    db::delete_item(&app, id).map_err(|e| e.to_string())
}

// Brand Commands
#[command]
pub fn create_brand(app: AppHandle, brand: Brand) -> Result<i64, String> {
    db::create_brand(&app, brand).map_err(|e| e.to_string())
}

#[command]
pub fn get_brands(app: AppHandle) -> Result<Vec<Brand>, String> {
    db::get_all_brands(&app).map_err(|e| e.to_string())
}

#[command]
pub fn update_brand(app: AppHandle, brand: Brand) -> Result<(), String> {
    db::update_brand(&app, brand).map_err(|e| e.to_string())
}

#[command]
pub fn delete_brand(app: AppHandle, id: i64) -> Result<(), String> {
    db::delete_brand(&app, id).map_err(|e| e.to_string())
}

// Model Commands
#[command]
pub fn create_model(app: AppHandle, model: Model) -> Result<i64, String> {
    db::create_model(&app, model).map_err(|e| e.to_string())
}

#[command]
pub fn get_models(app: AppHandle) -> Result<Vec<Model>, String> {
    db::get_all_models(&app).map_err(|e| e.to_string())
}

#[command]
pub fn update_model(app: AppHandle, model: Model) -> Result<(), String> {
    db::update_model(&app, model).map_err(|e| e.to_string())
}

#[command]
pub fn delete_model(app: AppHandle, id: i64) -> Result<(), String> {
    db::delete_model(&app, id).map_err(|e| e.to_string())
}

// Site Commands
#[command]
pub fn create_site(app: AppHandle, site: Site) -> Result<i64, String> {
    db::create_site(&app, site).map_err(|e| e.to_string())
}

#[command]
pub fn get_sites(app: AppHandle) -> Result<Vec<Site>, String> {
    db::get_all_sites(&app).map_err(|e| e.to_string())
}

#[command]
pub fn update_site(app: AppHandle, site: Site) -> Result<(), String> {
    db::update_site(&app, site).map_err(|e| e.to_string())
}

#[command]
pub fn delete_site(app: AppHandle, id: i64) -> Result<(), String> {
    db::delete_site(&app, id).map_err(|e| e.to_string())
}

// Inventory Transaction Type Commands
#[command]
pub fn get_inventory_transaction_types(
    app: AppHandle,
) -> Result<Vec<InventoryTransactionType>, String> {
    db::get_all_inventory_transaction_types(&app).map_err(|e| e.to_string())
}

// Inventory Voucher Commands
#[command]
pub fn create_inventory_voucher(app: AppHandle, voucher: InventoryVoucher) -> Result<i64, String> {
    db::create_inventory_voucher(&app, voucher).map_err(|e| e.to_string())
}

#[command]
pub fn get_inventory_vouchers(
    app: AppHandle,
    page: i64,
    limit: i64,
) -> Result<db::PaginatedResponse<InventoryVoucherDisplay>, String> {
    db::get_inventory_vouchers(&app, page, limit).map_err(|e| e.to_string())
}

#[command]
pub fn get_inventory_voucher(app: AppHandle, id: i64) -> Result<InventoryVoucher, String> {
    db::get_inventory_voucher(&app, id).map_err(|e| e.to_string())
}

#[command]
pub fn update_inventory_voucher(app: AppHandle, voucher: InventoryVoucher) -> Result<(), String> {
    db::update_inventory_voucher(&app, voucher).map_err(|e| e.to_string())
}

#[command]
pub fn delete_inventory_voucher(app: AppHandle, id: i64) -> Result<(), String> {
    db::delete_inventory_voucher(&app, id).map_err(|e| e.to_string())
}

#[command]
pub fn get_stock_balance(app: AppHandle, site_id: i64, item_id: i64) -> Result<f64, String> {
    db::get_stock_balance(&app, site_id, item_id).map_err(|e| e.to_string())
}

#[command]
pub fn get_stock_balances(
    app: AppHandle,
    item_name: Option<String>,
    site_id: Option<i64>,
    page: i64,
    limit: i64,
) -> Result<db::PaginatedResponse<db::StockBalance>, String> {
    db::get_stock_balances(&app, item_name, site_id, page, limit).map_err(|e| e.to_string())
}

#[command]
pub fn get_item_stock_by_sites(
    app: AppHandle,
    item_id: i64,
) -> Result<Vec<db::StockBalance>, String> {
    db::get_item_stock_by_sites(&app, item_id).map_err(|e| e.to_string())
}

#[command]
pub fn get_site_stock_balances(
    app: AppHandle,
    site_id: i64,
) -> Result<Vec<db::StockBalance>, String> {
    db::get_site_stock_balances(&app, site_id).map_err(|e| e.to_string())
}

#[command]
pub fn get_stock_movement_history(
    app: AppHandle,
    item_id: Option<i64>,
    site_id: Option<i64>,
    from_date: Option<String>,
    to_date: Option<String>,
    page: i64,
    limit: i64,
) -> Result<db::PaginatedResponse<db::StockMovementHistory>, String> {
    db::get_stock_movement_history(&app, item_id, site_id, from_date, to_date, page, limit)
        .map_err(|e| e.to_string())
}

#[command]
pub fn get_dashboard_stats(app: AppHandle) -> Result<db::DashboardStats, String> {
    db::get_dashboard_stats(&app).map_err(|e| e.to_string())
}
