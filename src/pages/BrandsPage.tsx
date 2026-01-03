import { useEffect, useState } from "react";
import { createBrand, deleteBrand, getBrands, updateBrand, Brand } from "../api";
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
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Pencil, X } from "lucide-react";

function BrandsPage() {
    const [brands, setBrands] = useState<Brand[]>([]);
    const [formData, setFormData] = useState({ name: "" });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchBrands = async () => {
        try {
            const data = await getBrands();
            setBrands(data);
        } catch (error) {
            console.error("Failed to fetch brands:", error);
        }
    };

    useEffect(() => {
        fetchBrands();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateBrand({ id: editingId, ...formData });
            } else {
                await createBrand(formData);
            }
            setFormData({ name: "" });
            setEditingId(null);
            fetchBrands();
        } catch (error) {
            console.error("Failed to save brand:", error);
            alert("Error saving brand: " + error);
        }
    };

    const handleEdit = (brand: Brand) => {
        setEditingId(brand.id!);
        setFormData({ name: brand.name });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: "" });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this brand?")) {
            try {
                await deleteBrand(id);
                fetchBrands();
            } catch (error) {
                console.error("Failed to delete brand:", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Brands Management</h2>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="flex flex-row gap-4 items-end max-w-4xl">
                        <div className="space-y-2 flex-1">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ name: e.target.value })}
                                required
                                placeholder="Brand Name"
                            />
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button type="submit">{editingId ? "Update Brand" : "Add Brand"}</Button>
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
                            <TableHead className="w-[80px]">ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {brands.map((brand) => (
                            <TableRow key={brand.id}>
                                <TableCell className="font-medium">{brand.id}</TableCell>
                                <TableCell>{brand.name}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(brand)}
                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(brand.id!)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {brands.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No brands found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default BrandsPage;
