import { useEffect, useState } from "react";
import { createModel, deleteModel, getModels, updateModel, Model } from "../api";
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

function ModelsPage() {
    const [models, setModels] = useState<Model[]>([]);
    const [formData, setFormData] = useState({ name: "" });
    const [editingId, setEditingId] = useState<number | null>(null);

    const fetchModels = async () => {
        try {
            const data = await getModels();
            setModels(data);
        } catch (error) {
            console.error("Failed to fetch models:", error);
        }
    };

    useEffect(() => {
        fetchModels();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateModel({ id: editingId, ...formData });
            } else {
                await createModel(formData);
            }
            setFormData({ name: "" });
            setEditingId(null);
            fetchModels();
        } catch (error) {
            console.error("Failed to save model:", error);
            alert("Error saving model: " + error);
        }
    };

    const handleEdit = (model: Model) => {
        setEditingId(model.id!);
        setFormData({ name: model.name });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({ name: "" });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this model?")) {
            try {
                await deleteModel(id);
                fetchModels();
            } catch (error) {
                console.error("Failed to delete model:", error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Models Management</h2>
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
                                placeholder="Model Name"
                            />
                        </div>
                        <div className="flex gap-2 shrink-0">
                            <Button type="submit">{editingId ? "Update Model" : "Add Model"}</Button>
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
                            <TableHead className="w-[80px]">S.No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {models.map((model, index) => (
                            <TableRow key={model.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>{model.name}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleEdit(model)}
                                        className="text-primary hover:text-primary hover:bg-primary/10"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(model.id!)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {models.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No models found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default ModelsPage;
