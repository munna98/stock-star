import { useEffect, useState } from "react";
import { createItem, deleteItem, getItems, getBrands, getModels, updateItem, Brand, Model, Item } from "../api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Pencil, X } from "lucide-react";

function ItemsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [models, setModels] = useState<Model[]>([]);
    const [formData, setFormData] = useState<Omit<Item, "id">>({
        code: "",
        name: "",
        brand_id: undefined,
        model_id: undefined,
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            const [itemsData, brandsData, modelsData] = await Promise.all([
                getItems(),
                getBrands(),
                getModels(),
            ]);
            setItems(itemsData);
            setBrands(brandsData);
            setModels(modelsData);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateItem({ id: editingId, ...formData });
            } else {
                await createItem(formData as Item);
            }
            setFormData({
                code: "",
                name: "",
                brand_id: undefined,
                model_id: undefined,
            });
            setEditingId(null);
            fetchData();
        } catch (error) {
            console.error("Failed to save item:", error);
            alert("Error saving item: " + error);
        }
    };

    const handleEdit = (item: Item) => {
        setEditingId(item.id!);
        setFormData({
            code: item.code,
            name: item.name,
            brand_id: item.brand_id,
            model_id: item.model_id,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            code: "",
            name: "",
            brand_id: undefined,
            model_id: undefined,
        });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this item?")) {
            try {
                await deleteItem(id);
                fetchData();
            } catch (error) {
                console.error("Failed to delete item:", error);
            }
        }
    };

    const getBrandName = (id?: number) => brands.find((b) => b.id === id)?.name || "N/A";
    const getModelName = (id?: number) => models.find((m) => m.id === id)?.name || "N/A";

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Items Management</h2>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="flex flex-row gap-4 items-end overflow-x-auto pb-2">
                        <div className="flex-[1] min-w-[120px]">
                            <Label htmlFor="code">Item Code</Label>
                            <Input
                                id="code"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                                placeholder="ITEM001"
                            />
                        </div>
                        <div className="flex-[2] min-w-[200px]">
                            <Label htmlFor="name">Item Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="Product Name"
                            />
                        </div>
                        <div className="flex-[1.5] min-w-[150px]">
                            <Label htmlFor="brand">Brand</Label>
                            <Select
                                value={formData.brand_id?.toString()}
                                onValueChange={(value) => setFormData({ ...formData, brand_id: parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.id!.toString()}>
                                            {brand.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-[1.5] min-w-[150px]">
                            <Label htmlFor="model">Model</Label>
                            <Select
                                value={formData.model_id?.toString()}
                                onValueChange={(value) => setFormData({ ...formData, model_id: parseInt(value) })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.id} value={model.id!.toString()}>
                                            {model.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button type="submit">{editingId ? "Update Item" : "Add Item"}</Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    <X className="h-4 w-4 mr-2" />
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.code}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>{getBrandName(item.brand_id)}</TableCell>
                                <TableCell>{getModelName(item.model_id)}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(item)}
                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item.id!)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default ItemsPage;
