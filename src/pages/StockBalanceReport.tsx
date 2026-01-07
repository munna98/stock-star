import { useEffect, useState } from "react";
import { getStockBalances, StockBalance } from "../api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

function StockBalanceReport() {
    const [balances, setBalances] = useState<StockBalance[]>([]);
    const [filteredBalances, setFilteredBalances] = useState<StockBalance[]>([]);
    const [filters, setFilters] = useState({
        itemName: "",
        site: "all",
    });

    useEffect(() => {
        fetchBalances();
    }, []);

    const fetchBalances = async () => {
        try {
            const data = await getStockBalances();
            setBalances(data);
            setFilteredBalances(data);
        } catch (error) {
            console.error("Failed to fetch stock balances:", error);
        }
    };

    useEffect(() => {
        const filtered = balances.filter((b) => {
            return (
                (filters.itemName === "" || filters.itemName === "all" || b.item_name.toLowerCase().includes(filters.itemName.toLowerCase())) &&
                (filters.site === "all" || b.site_name === filters.site)
            );
        });
        setFilteredBalances(filtered);
    }, [filters, balances]);

    const uniqueSites = [...new Set(balances.map((b) => b.site_name))];
    const uniqueItems = [
        { label: "All Items", value: "all" },
        ...Array.from(new Set(balances.map((b) => b.item_name))).map(name => ({
            label: name,
            value: name
        }))
    ];

    const handleFilterChange = (key: string, value: string) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        setFilters({
            itemName: "",
            site: "all",
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Stock Balance Report</h2>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Combobox
                            options={uniqueItems}
                            value={filters.itemName}
                            onChange={(val) => handleFilterChange("itemName", val)}
                            placeholder="Filter by item name..."
                            className="flex-1"
                        />
                        <Select value={filters.site} onValueChange={(value) => handleFilterChange("site", value)}>
                            <SelectTrigger className="w-auto">
                                <SelectValue placeholder="Site" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sites</SelectItem>
                                {uniqueSites.map((site) => (
                                    <SelectItem key={site} value={site}>
                                        {site}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <button
                            onClick={clearFilters}
                            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 whitespace-nowrap"
                        >
                            Clear Filters
                        </button>
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item Code</TableHead>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Model</TableHead>
                            <TableHead>Site</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredBalances.map((balance) => (
                            <TableRow key={`${balance.item_id}-${balance.site_id}`}>
                                <TableCell className="font-medium">{balance.item_code}</TableCell>
                                <TableCell>{balance.item_name}</TableCell>
                                <TableCell>{balance.brand_name || "N/A"}</TableCell>
                                <TableCell>{balance.model_name || "N/A"}</TableCell>
                                <TableCell>{balance.site_name}</TableCell>
                                <TableCell className="text-right font-semibold">
                                    {balance.balance.toFixed(2)}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filters.itemName && filters.itemName !== "all" && filteredBalances.length > 0 && (
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={5} className="text-right">Total Balance:</TableCell>
                                <TableCell className="text-right">
                                    {filteredBalances.reduce((sum, b) => sum + b.balance, 0).toFixed(2)}
                                </TableCell>
                            </TableRow>
                        )}
                        {filteredBalances.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    No stock balances found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export default StockBalanceReport;
