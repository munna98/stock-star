import { useEffect, useState } from "react";
import { getStockMovementHistory, getItems, getSites, StockMovementHistory, Item, Site } from "../api";
import { formatDate } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { X } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";

function StockMovementReport() {
    const [movements, setMovements] = useState<StockMovementHistory[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [sites, setSites] = useState<Site[]>([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    const [filters, setFilters] = useState({
        itemId: "all" as number | "all",
        siteId: "all" as number | "all",
        fromDate: "",
        toDate: "",
    });

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [itemsData, sitesData] = await Promise.all([
                getItems(),
                getSites(),
            ]);
            setItems(itemsData);
            setSites(sitesData);
        } catch (error) {
            console.error("Failed to fetch master data:", error);
        }
    };

    useEffect(() => {
        // Reset to page 1 when filters change
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        handleSearch();
    }, [filters, currentPage, pageSize]);

    const handleSearch = async () => {
        try {
            const data = await getStockMovementHistory(
                filters.itemId === "all" ? undefined : filters.itemId,
                filters.siteId === "all" ? undefined : filters.siteId,
                filters.fromDate || undefined,
                filters.toDate || undefined,
                currentPage,
                pageSize
            );
            setMovements(data.items);
            setTotalCount(data.total_count);
        } catch (error) {
            console.error("Failed to fetch movements:", error);
        }
    };

    const handleClear = () => {
        setFilters({
            itemId: "all",
            siteId: "all",
            fromDate: "",
            toDate: "",
        });
        setCurrentPage(1);
        setMovements([]);
        setTotalCount(0);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Stock Movement History</h2>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="space-y-2">
                            <Label>Item</Label>
                            <Combobox
                                options={[
                                    { label: "All Items", value: "all" },
                                    ...items.map(i => ({
                                        label: `${i.name} (${i.code})`,
                                        value: String(i.id)
                                    }))
                                ]}
                                value={String(filters.itemId)}
                                onChange={(val) => setFilters({ ...filters, itemId: val === "all" ? "all" : Number(val) })}
                                placeholder="All Items"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Site</Label>
                            <Combobox
                                options={[
                                    { label: "All Sites", value: "all" },
                                    ...sites.map(s => ({
                                        label: `${s.name} (${s.type})`,
                                        value: String(s.id)
                                    }))
                                ]}
                                value={String(filters.siteId)}
                                onChange={(val) => setFilters({ ...filters, siteId: val === "all" ? "all" : Number(val) })}
                                placeholder="All Sites"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>From Date</Label>
                            <Input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>To Date</Label>
                            <Input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button variant="outline" onClick={handleClear} className="w-full">
                                <X className="h-4 w-4 mr-2" />
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="rounded-md border bg-card">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>V No</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Item</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Site</TableHead>
                                <TableHead>Remarks</TableHead>
                                <TableHead className="text-right">In</TableHead>
                                <TableHead className="text-right">Out</TableHead>
                                <TableHead className="text-right">Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movements.map((movement) => (
                                <TableRow key={movement.id}>
                                    <TableCell>{formatDate(movement.voucher_date)}</TableCell>
                                    <TableCell className="font-medium">{movement.transaction_number}</TableCell>
                                    <TableCell>{movement.voucher_type_name}</TableCell>
                                    <TableCell>{movement.item_name}</TableCell>
                                    <TableCell>{movement.brand_name || "N/A"}</TableCell>
                                    <TableCell>{movement.model_name || "N/A"}</TableCell>
                                    <TableCell>{movement.site_name}</TableCell>
                                    <TableCell className="max-w-[100px] truncate" title={movement.remarks || ""}>
                                        {movement.remarks || "-"}
                                    </TableCell>
                                    <TableCell className="text-right text-green-600 font-medium">
                                        {movement.stock_in > 0 ? movement.stock_in.toFixed(2) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right text-red-600 font-medium">
                                        {movement.stock_out > 0 ? movement.stock_out.toFixed(2) : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {filters.itemId !== "all" ? movement.running_balance.toFixed(2) : "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {movements.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={11} className="h-24 text-center text-muted-foreground">
                                        {(filters.itemId !== "all" || filters.siteId !== "all" || filters.fromDate || filters.toDate)
                                            ? "No movements found for the selected criteria."
                                            : "Select filters to view stock movements."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="border-t p-0">
                    <div className="w-full">
                        <PaginationControls
                            currentPage={currentPage}
                            totalCount={totalCount}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            onPageSizeChange={setPageSize}
                        />
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default StockMovementReport;
