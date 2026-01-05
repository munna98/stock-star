// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

mod commands;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            db::init_db(app.handle()).expect("failed to initialize database");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::create_item,
            commands::get_items,
            commands::update_item,
            commands::delete_item,
            commands::create_brand,
            commands::get_brands,
            commands::update_brand,
            commands::delete_brand,
            commands::create_model,
            commands::get_models,
            commands::update_model,
            commands::delete_model,
            commands::create_site,
            commands::get_sites,
            commands::update_site,
            commands::delete_site,
            commands::get_inventory_transaction_types,
            commands::create_inventory_voucher,
            commands::get_inventory_vouchers,
            commands::get_stock_balance,
            commands::get_stock_balances,
            commands::get_item_stock_by_sites,
            commands::get_site_stock_balances,
            commands::get_stock_movement_history
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
