import { invoke } from "@tauri-apps/api/core";

export interface Brand {
    id?: number;
    name: string;
}

export interface Model {
    id?: number;
    name: string;
}

export interface Item {
    id?: number;
    code: string;
    name: string;
    brand_id?: number;
    model_id?: number;
    brand_name?: string;
    model_name?: string;
    is_active: boolean;
}

export interface Site {
    id?: number;
    code: string;
    name: string;
    address?: string;
    type: "Site" | "Warehouse";
    is_active: boolean;
}

export interface InventoryTransactionType {
    id: number;
    name: string;
}

export interface InventoryVoucher {
    id?: number;
    transaction_number?: string;
    voucher_date: string;
    source_site_id?: number;
    destination_site_id?: number;
    voucher_type_id: number;
    items: InventoryVoucherItem[];
    remarks?: string;
    created_at?: string;
    created_by?: number;
}

export interface InventoryVoucherDisplay {
    id: number;
    transaction_number: string;
    voucher_date: string;
    source_site_id?: number;
    source_site_name?: string;
    destination_site_id?: number;
    destination_site_name?: string;
    voucher_type_id: number;
    voucher_type_name: string;
    remarks?: string;
    created_at: string;
}

export interface InventoryVoucherItem {
    id?: number;
    inventory_voucher_id?: number;
    item_id: number;
    quantity: number;
}

export interface StockBalance {
    item_id: number;
    item_code: string;
    item_name: string;
    brand_name?: string;
    model_name?: string;
    site_id: number;
    site_code: string;
    site_name: string;
    site_type: string;
    balance: number;
}

export interface StockMovementHistory {
    id: number;
    voucher_id: number;
    transaction_number: string;
    voucher_date: string;
    voucher_type_name: string;
    item_id: number;
    item_code: string;
    item_name: string;
    brand_name?: string;
    model_name?: string;
    site_id: number;
    site_code: string;
    site_name: string;
    stock_in: number;
    stock_out: number;
    running_balance: number;
    remarks?: string;
    created_at: string;
}

// Item API
export const createItem = async (item: Item): Promise<number> => {
    return await invoke("create_item", { item });
};

export const getItems = async (): Promise<Item[]> => {
    return await invoke("get_items");
};

export const updateItem = async (item: Item): Promise<void> => {
    return await invoke("update_item", { item });
};

export const deleteItem = async (id: number): Promise<void> => {
    return await invoke("delete_item", { id });
};

// Brand API
export const createBrand = async (brand: Brand): Promise<number> => {
    return await invoke("create_brand", { brand });
};

export const getBrands = async (): Promise<Brand[]> => {
    return await invoke("get_brands");
};

export const updateBrand = async (brand: Brand): Promise<void> => {
    return await invoke("update_brand", { brand });
};

export const deleteBrand = async (id: number): Promise<void> => {
    return await invoke("delete_brand", { id });
};

// Model API
export const createModel = async (model: Model): Promise<number> => {
    return await invoke("create_model", { model });
};

export const getModels = async (): Promise<Model[]> => {
    return await invoke("get_models");
};

export const updateModel = async (model: Model): Promise<void> => {
    return await invoke("update_model", { model });
};

export const deleteModel = async (id: number): Promise<void> => {
    return await invoke("delete_model", { id });
};

// Site API
export const createSite = async (site: Site): Promise<number> => {
    return await invoke("create_site", { site });
};

export const getSites = async (): Promise<Site[]> => {
    return await invoke("get_sites");
};

export const updateSite = async (site: Site): Promise<void> => {
    return await invoke("update_site", { site });
};

export const deleteSite = async (id: number): Promise<void> => {
    return await invoke("delete_site", { id });
};

export interface PaginatedResponse<T> {
    items: T[];
    total_count: number;
}

export interface PaginationParams {
    page: number;
    limit: number;
}

// Inventory Transaction Type API
export const getInventoryTransactionTypes = async (): Promise<InventoryTransactionType[]> => {
    return await invoke("get_inventory_transaction_types");
};

// Inventory Voucher API
export const createInventoryVoucher = async (voucher: InventoryVoucher): Promise<number> => {
    return await invoke("create_inventory_voucher", { voucher });
};

export const getInventoryVouchers = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<InventoryVoucherDisplay>> => {
    return await invoke("get_inventory_vouchers", { page, limit });
};

export const getInventoryVoucher = async (id: number): Promise<InventoryVoucher> => {
    return await invoke("get_inventory_voucher", { id });
};

export const updateInventoryVoucher = async (voucher: InventoryVoucher): Promise<void> => {
    return await invoke("update_inventory_voucher", { voucher });
};

export const deleteInventoryVoucher = async (id: number): Promise<void> => {
    return await invoke("delete_inventory_voucher", { id });
};

export const getStockBalance = async (siteId: number, itemId: number): Promise<number> => {
    return await invoke("get_stock_balance", { siteId, itemId });
};

export const getStockBalances = async (
    itemName?: string,
    siteId?: number,
    page: number = 1,
    limit: number = 10
): Promise<PaginatedResponse<StockBalance>> => {
    return await invoke("get_stock_balances", { itemName, siteId, page, limit });
};

export const getItemStockBySites = async (itemId: number): Promise<StockBalance[]> => {
    return await invoke("get_item_stock_by_sites", { itemId });
};

export const getSiteStockBalances = async (siteId: number): Promise<StockBalance[]> => {
    return await invoke("get_site_stock_balances", { siteId });
};

export const getStockMovementHistory = async (
    itemId?: number,
    siteId?: number,
    voucherTypeId?: number,
    fromDate?: string,
    toDate?: string,
    page: number = 1,
    limit: number = 10
): Promise<PaginatedResponse<StockMovementHistory>> => {
    return await invoke("get_stock_movement_history", {
        itemId,
        siteId,
        voucherTypeId,
        fromDate,
        toDate,
        page,
        limit
    });
};

export interface DashboardStats {
    active_items_count: number;
    active_sites_count: number;
    recent_transactions_count: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    return await invoke("get_dashboard_stats");
};

