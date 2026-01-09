import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    InventoryVoucherDisplay,
    getInventoryVouchers,
    deleteInventoryVoucher,
    getInventoryVoucher,
    getSites,
    getItems,
    getInventoryTransactionTypes,
    // Site, // Unused
    // Item, // Unused
    // InventoryTransactionType // Unused
} from "../api";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Edit, Trash2, Plus, Printer, Eye } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { generateVoucherPrintHTML, openPrintWindow } from "@/lib/printUtils";

export default function TransactionHistoryPage() {
    const [transactions, setTransactions] = useState<InventoryVoucherDisplay[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [totalCount, setTotalCount] = useState(0);
    const [isPrinting, setIsPrinting] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        loadTransactions();
    }, [currentPage, pageSize]);

    const loadTransactions = async () => {
        try {
            const data = await getInventoryVouchers(currentPage, pageSize);
            setTransactions(data.items);
            setTotalCount(data.total_count);
        } catch (error) {
            console.error("Failed to load transactions", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm("Are you sure you want to delete this transaction? This action cannot be undone.")) {
            try {
                await deleteInventoryVoucher(id);
                loadTransactions(); // Reload list
            } catch (error) {
                console.error("Failed to delete transaction", error);
                alert("Failed to delete transaction.");
            }
        }
    };

    const handleEdit = (id: number) => {
        navigate(`/inventory-vouchers?edit_id=${id}`);
    };

    const handleView = (id: number) => {
        navigate(`/inventory-vouchers?view_id=${id}`);
    };

    const handlePrint = async (id: number) => {
        if (isPrinting) return;
        setIsPrinting(true);
        try {
            // Fetch all necessary data
            // In a better optimized app, we would have an API endpoint that returns the full voucher with expanded names.
            // For now, we fetch master data to resolve names.
            const [voucher, sites, items, types] = await Promise.all([
                getInventoryVoucher(id),
                getSites(),
                getItems(),
                getInventoryTransactionTypes()
            ]);

            const typeName = types.find(t => t.id === voucher.voucher_type_id)?.name || "Voucher";
            const sourceName = sites.find(s => s.id === voucher.source_site_id)?.name;
            const destName = sites.find(s => s.id === voucher.destination_site_id)?.name;

            // Filter valid items
            const printItems = (voucher.items || [])
                .filter(vi => vi.item_id && vi.item_id > 0)
                .map(vi => {
                    const item = items.find(i => i.id === vi.item_id);
                    return {
                        item_code: item?.code || "",
                        item_name: item?.name || "Unknown Item",
                        brand_name: item?.brand_name,
                        model_name: item?.model_name,
                        quantity: vi.quantity,
                        unit: "Unit" // Default unit as it's not in Item interface
                    };
                });

            if (printItems.length === 0) {
                alert("No items to print.");
                return;
            }

            const details = [
                { label: "Voucher No", value: voucher.transaction_number || String(voucher.id) },
                { label: "Date", value: formatDate(voucher.voucher_date) },
                { label: "Type", value: typeName },
                { label: "Remarks", value: voucher.remarks || "-" },
            ];

            if (sourceName) details.push({ label: "Source", value: sourceName });
            if (destName) details.push({ label: "Destination", value: destName });

            const html = generateVoucherPrintHTML({
                title: typeName.toUpperCase(),
                details,
                items: printItems
            });

            openPrintWindow(html);

        } catch (error) {
            console.error("Failed to print voucher:", error);
            alert("Failed to generated print view.");
        } finally {
            setIsPrinting(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Transaction History</h2>
                </div>
                <Button onClick={() => navigate("/inventory-vouchers")}>
                    <Plus className="mr-2 h-4 w-4" /> New Transaction
                </Button>
            </div>

            <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-0">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0">
                            <TableRow>
                                <TableHead className="w-[100px]">Date</TableHead>
                                <TableHead>Trans. No</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Source</TableHead>
                                <TableHead>Destination</TableHead>
                                <TableHead className="w-[200px]">Remarks</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                        No transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((t) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {formatDate(t.voucher_date)}
                                        </TableCell>
                                        <TableCell>{t.transaction_number}</TableCell>
                                        <TableCell>{t.voucher_type_name}</TableCell>
                                        <TableCell>{t.source_site_name || "-"}</TableCell>
                                        <TableCell>{t.destination_site_name || "-"}</TableCell>
                                        <TableCell className="truncate max-w-[200px]" title={t.remarks || ""}>
                                            {t.remarks}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handlePrint(t.id)}
                                                    disabled={isPrinting}
                                                    className="h-8 w-8 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Printer className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleView(t.id)}
                                                    className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(t.id)}
                                                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(t.id)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
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
                            onPageSizeChange={(size) => {
                                setPageSize(size);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
