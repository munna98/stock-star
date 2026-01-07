import { useEffect, useState } from "react";
import { getStockBalances, StockBalance, getSites, Site, getItems, Item } from "../api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Combobox } from "@/components/ui/combobox";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PaginationControls } from "@/components/ui/pagination-controls";

function StockBalanceReport() {
    const [balances, setBalances] = useState<StockBalance[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [items, setItems] = useState<Item[]>([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);

    const [filters, setFilters] = useState({
        itemName: "",
        site: "all",
    });

    useEffect(() => {
        fetchMasterData();
    }, []);

    const fetchMasterData = async () => {
        try {
            const [sitesData, itemsData] = await Promise.all([
                getSites(),
                getItems()
            ]);
            setSites(sitesData);
            setItems(itemsData);
        } catch (error) {
            console.error("Failed to fetch master data:", error);
        }
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [filters]);

    useEffect(() => {
        fetchBalances();
    }, [filters, currentPage, pageSize]);

    const fetchBalances = async () => {
        try {


            let selectedSiteId: number | undefined = undefined;
            if (filters.site !== "all") {
                const foundSite = sites.find(s => s.name === filters.site);
                if (foundSite) selectedSiteId = foundSite.id;
            }

            const data = await getStockBalances(
                filters.itemName || undefined,
                selectedSiteId,
                currentPage,
                pageSize
            );
            setBalances(data.items);
            setTotalCount(data.total_count);
        } catch (error) {
            console.error("Failed to fetch stock balances:", error);
        }
    };

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
        setCurrentPage(1);
    };

    // Derived site options from fetched master data
    // Previously it was derived from loaded balances. Now we use all available sites.

    // Provide options for Item Name autocomplete. 
    // Ideally this should also be server-side search but for now using all items list is okay if not too large.
    const itemOptions = [
        { label: "All Items", value: "" }, // Empty string for all
        ...items.map(i => ({
            label: i.name,
            value: i.name
        }))
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Stock Balance Report</h2>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Combobox
                            options={itemOptions}
                            value={filters.itemName}
                            onChange={(val) => handleFilterChange("itemName", val)}
                            placeholder="Filter by item name..."
                            className="flex-1"
                        />
                        <Select value={filters.site} onValueChange={(value) => handleFilterChange("site", value)}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Site" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sites</SelectItem>
                                {sites.map((site) => (
                                    <SelectItem key={site.id} value={site.name}>
                                        {site.name}
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

            <Card className="rounded-md border bg-card">
                <CardContent className="p-0">
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
                            {balances.map((balance) => (
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
                            {/* Total Only shown if Item Filter is Active */}
                            {filters.itemName && balances.length > 0 && (
                                <TableRow className="bg-muted/50 font-bold">
                                    <TableCell colSpan={5} className="text-right">Total Balance (Visible Page):</TableCell>
                                    <TableCell className="text-right">
                                        {balances.reduce((sum, b) => sum + b.balance, 0).toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            )}
                            {balances.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No stock balances found.
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

export default StockBalanceReport;
