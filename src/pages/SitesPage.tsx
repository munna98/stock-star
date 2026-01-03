import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSite, deleteSite, getSites, updateSite, Site } from "../api";
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
import { Trash2, Pencil, X, PackagePlus, PackageMinus, Settings2 } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

function SitesPage() {
    const [sites, setSites] = useState<Site[]>([]);
    const [formData, setFormData] = useState<Omit<Site, "id">>({
        code: "",
        name: "",
        address: "",
        type: "Site",
        is_active: true,
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const navigate = useNavigate();

    const fetchSites = async () => {
        try {
            const data = await getSites();
            setSites(data);
        } catch (error) {
            console.error("Failed to fetch sites:", error);
        }
    };

    useEffect(() => {
        fetchSites();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateSite({ id: editingId, ...formData });
            } else {
                await createSite(formData as Site);
            }
            setFormData({
                code: "",
                name: "",
                address: "",
                type: "Site",
                is_active: true,
            });
            setEditingId(null);
            fetchSites();
        } catch (error) {
            console.error("Failed to save site:", error);
            alert("Error saving site: " + error);
        }
    };

    const handleEdit = (site: Site) => {
        setEditingId(site.id!);
        setFormData({
            code: site.code,
            name: site.name,
            address: site.address || "",
            type: site.type,
            is_active: site.is_active,
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({
            code: "",
            name: "",
            address: "",
            type: "Site",
            is_active: true,
        });
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this site/warehouse?")) {
            try {
                await deleteSite(id);
                fetchSites();
            } catch (error) {
                console.error("Failed to delete site:", error);
            }
        }
    };

    return (
        <TooltipProvider>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Sites & Warehouses</h2>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="flex flex-row gap-4 items-end overflow-x-auto pb-2">
                            <div className="flex-[1] min-w-[100px]">
                                <Label htmlFor="code">Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    required
                                    placeholder="S001"
                                />
                            </div>
                            <div className="flex-[2] min-w-[180px]">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Main Warehouse"
                                />
                            </div>
                            <div className="flex-[1.5] min-w-[130px]">
                                <Label htmlFor="type">Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: "Site" | "Warehouse") =>
                                        setFormData({ ...formData, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Site">Site</SelectItem>
                                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-[3] min-w-[250px]">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="Full Address"
                                />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <Button type="submit">{editingId ? "Update Site" : "Add Site"}</Button>
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
                                <TableHead className="w-[60px]">S.No</TableHead>
                                <TableHead className="w-[100px]">Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="w-[150px]">Stock Actions</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sites.map((site, index) => (
                                <TableRow key={site.id}>
                                    <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                                    <TableCell className="font-medium">{site.code}</TableCell>
                                    <TableCell>{site.name}</TableCell>
                                    <TableCell>{site.type}</TableCell>
                                    <TableCell>{site.address}</TableCell>
                                    <TableCell className="space-x-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                    onClick={() => navigate(`/inventory-vouchers?type=Purchase Inward&destination=${site.id}`)}
                                                >
                                                    <PackagePlus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Stock In (Purchase)</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                    onClick={() => navigate(`/inventory-vouchers?type=Material Usage&source=${site.id}`)}
                                                >
                                                    <PackageMinus className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Stock Out (Usage)</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={() => navigate(`/inventory-vouchers?type=Stock Adjustment&destination=${site.id}`)}
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Adjustment (In)</TooltipContent>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(site)}
                                            className="text-primary hover:text-primary hover:bg-primary/10"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(site.id!)}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {sites.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No sites or warehouses found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </TooltipProvider>
    );
}

export default SitesPage;
