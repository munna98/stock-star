use crate::db::{self, Brand, Item, Model, Site};
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
