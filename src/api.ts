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
}

export interface Site {
    id?: number;
    code: string;
    name: string;
    address?: string;
    type: "Site" | "Warehouse";
    is_active: boolean;
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
