import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEnterKeyNavigation } from "../hooks/useEnterKeyNavigation";
import {
    getInventoryTransactionTypes,
    getSites,
    getItems,

    createInventoryVoucher,
    updateInventoryVoucher,
    getInventoryVoucher,
    getStockBalance,
    InventoryTransactionType,
    Site,
    Item,
    InventoryVoucher,
    InventoryVoucherItem
} from "../api";
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
import { Trash2, Plus, Save, Printer, RotateCcw, Clock, X } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";

function StockEntryPage() {
    const [transactionTypes, setTransactionTypes] = useState<InventoryTransactionType[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isEditMode = searchParams.get("edit_id") != null;
    const { handleKeyDown } = useEnterKeyNavigation();
    const [focusNewRow, setFocusNewRow] = useState(false);

    const [voucher, setVoucher] = useState<Partial<InventoryVoucher>>({
        voucher_date: new Date().toISOString().split('T')[0],
        voucher_type_id: 0,
        source_site_id: undefined,
        destination_site_id: undefined,
        items: [{ item_id: 0, quantity: 1 } as any]
    });

    const [stockBalances, setStockBalances] = useState<Record<number, number>>({});

    const fetchStockBalance = async (itemId: number, siteId: number) => {
        if (!itemId || !siteId) return;
        try {
            const balance = await getStockBalance(siteId, itemId);
            setStockBalances(prev => ({ ...prev, [itemId]: balance }));
        } catch (error) {
            console.error("Failed to fetch stock balance:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const [typesData, sitesData, itemsData] = await Promise.all([
                getInventoryTransactionTypes(),
                getSites(),
                getItems()
            ]);
            setTransactionTypes(typesData);
            setSites(sitesData);
            setItems(itemsData);

            // Handle URL Search Params
            const editId = searchParams.get("edit_id");
            if (editId) {
                try {
                    const voucherData = await getInventoryVoucher(Number(editId));
                    setVoucher(voucherData);
                    // Fetch stock balances for existing items
                    if (voucherData.source_site_id) {
                        voucherData.items.forEach(async (item) => {
                            if (item.item_id) fetchStockBalance(item.item_id, voucherData.source_site_id!);
                        });
                    }
                } catch (error) {
                    console.error("Failed to load voucher for editing:", error);
                    alert("Failed to load voucher.");
                }
            } else {
                // ... Existing init logic for new entry ...
                const typeParam = searchParams.get("type");
                const sourceParam = searchParams.get("source");
                const destParam = searchParams.get("destination");

                if (typeParam) {
                    const foundType = typesData.find(t => t.name === typeParam || String(t.id) === typeParam);
                    if (foundType) {
                        setVoucher(prev => ({ ...prev, voucher_type_id: foundType.id }));
                    }
                } else if (typesData.length > 0) {
                    setVoucher(prev => ({ ...prev, voucher_type_id: typesData[0].id }));
                }

                if (sourceParam) {
                    setVoucher(prev => ({ ...prev, source_site_id: Number(sourceParam) }));
                }
                if (destParam) {
                    setVoucher(prev => ({ ...prev, destination_site_id: Number(destParam) }));
                }
            }
        };
        fetchData();
    }, [searchParams]);

    const selectedType = transactionTypes.find(t => t.id === voucher.voucher_type_id);

    const showSource = selectedType && !["Purchase Inward", "Opening Stock"].includes(selectedType.name);
    const showDestination = selectedType && !["Material Usage", "Damaged Stock"].includes(selectedType.name);

    // Filter sites based on transaction type
    const getSourceSites = () => {
        if (!selectedType) return sites;

        switch (selectedType.name) {
            case "Godown → Site":
                return sites.filter(s => s.type === "Warehouse");
            case "Site → Godown":
                return sites.filter(s => s.type === "Site");
            case "Site → Site":
                return sites.filter(s => s.type === "Site");
            default:
                return sites;
        }
    };

    const getDestinationSites = () => {
        if (!selectedType) return sites;

        switch (selectedType.name) {
            case "Godown → Site":
                return sites.filter(s => s.type === "Site");
            case "Site → Godown":
                return sites.filter(s => s.type === "Warehouse");
            case "Site → Site":
                return sites.filter(s => s.type === "Site");
            default:
                return sites;
        }
    };

    const filteredSourceSites = getSourceSites();
    const filteredDestinationSites = getDestinationSites();

    const addItemRow = () => {
        setVoucher(prev => ({
            ...prev,
            items: [...(prev.items || []), { item_id: 0, quantity: 1 } as any]
        }));
    };

    useEffect(() => {
        if (focusNewRow && voucher.items) {
            const lastIndex = voucher.items.length - 1;
            const nextItemInput = document.querySelector(`#item-input-${lastIndex}`) as HTMLElement;
            if (nextItemInput) {
                nextItemInput.focus();
                setFocusNewRow(false);
            }
        }
    }, [voucher.items, focusNewRow]);


    const removeItemRow = (index: number) => {
        setVoucher(prev => ({
            ...prev,
            items: prev.items?.filter((_, i) => i !== index)
        }));
    };

    const updateItemRow = (index: number, field: keyof InventoryVoucherItem, value: any) => {
        const newItems = [...(voucher.items || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        setVoucher(prev => ({ ...prev, items: newItems }));

        if (field === "item_id" && voucher.source_site_id) {
            fetchStockBalance(value, voucher.source_site_id);
        }
    };

    const handleSave = async () => {
        if (!voucher.voucher_type_id) {
            alert("Please select a transaction type");
            return;
        }

        if (showSource && !voucher.source_site_id) {
            alert("Please select a source site");
            return;
        }

        if (showDestination && !voucher.destination_site_id) {
            alert("Please select a destination site");
            return;
        }

        const validItems = voucher.items?.filter(i => i.item_id > 0 && i.quantity > 0);
        if (!validItems || validItems.length === 0) {
            alert("Please add at least one valid item");
            return;
        }

        try {
            if (isEditMode && voucher.id) {
                await updateInventoryVoucher({
                    ...voucher,
                    items: validItems
                } as InventoryVoucher);
                alert("Voucher updated successfully!");
                navigate("/transactions");
            } else {
                await createInventoryVoucher({
                    ...voucher,
                    items: validItems
                } as InventoryVoucher);
                alert("Voucher saved successfully!");
                setVoucher({
                    voucher_date: new Date().toISOString().split('T')[0],
                    voucher_type_id: transactionTypes[0]?.id,
                    source_site_id: undefined,
                    destination_site_id: undefined,
                    items: [{ item_id: 0, quantity: 1 } as any]
                });
            }
        } catch (error) {
            console.error("Failed to save/update voucher:", error);
            alert("Error: " + error);
        }
    };

    const handleClear = () => {
        if (confirm("Are you sure you want to clear this entry?")) {
            if (isEditMode) {
                navigate("/transactions");
            } else {
                setVoucher({
                    voucher_date: new Date().toISOString().split('T')[0],
                    voucher_type_id: transactionTypes[0]?.id,
                    source_site_id: undefined,
                    destination_site_id: undefined,
                    items: [{ item_id: 0, quantity: 1 } as any]
                });
            }
        }
    };

    const handlePrint = () => {
        alert("Print functionality will be implemented later.");
    };

    const handleViewHistory = () => {
        navigate("/transactions");
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)]">
            <div className="flex-1 space-y-6 overflow-y-auto pb-20 pr-1">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Stock Transaction Entry</h2>
                    <Button variant="outline" onClick={handleViewHistory}>
                        <Clock className="w-4 h-4 mr-2" />
                        View History
                    </Button>
                </div>

                <Card className="border-2">
                    <CardContent className="flex flex-row gap-4 items-end pt-4 pb-4">
                        <div className="flex-1 min-w-[130px]">
                            <Label>Date</Label>
                            <Input
                                id="date-input"
                                type="date"
                                value={voucher.voucher_date}
                                onChange={(e) => setVoucher({ ...voucher, voucher_date: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, "#type-input")}
                                className="h-8 w-full"
                            />

                        </div>

                        <div className="flex-1 min-w-[180px]">
                            <Label>Transaction Type</Label>
                            <Combobox
                                id="type-input"
                                options={transactionTypes.map(t => ({ label: t.name, value: String(t.id) }))}
                                value={voucher.voucher_type_id ? String(voucher.voucher_type_id) : ""}
                                onChange={(val) => setVoucher({ ...voucher, voucher_type_id: Number(val) })}
                                onKeyDown={(e) => handleKeyDown(e, showSource ? "#source-input" : (showDestination ? "#dest-input" : "#remarks-input"))}
                                placeholder="Select type"
                                className="h-8 w-full"
                            />

                        </div>

                        <div className="flex-1 min-w-[180px]">
                            <Label>Source (From)</Label>
                            {showSource ? (
                                <Combobox
                                    id="source-input"
                                    options={filteredSourceSites
                                        .filter(s => s.is_active || s.id === voucher.source_site_id)
                                        .map(s => ({ label: `${s.name} (${s.type})`, value: String(s.id) }))}
                                    value={voucher.source_site_id ? String(voucher.source_site_id) : ""}
                                    onChange={(val) => {
                                        const siteId = Number(val);
                                        setVoucher({ ...voucher, source_site_id: siteId });
                                        voucher.items?.forEach(item => {
                                            if (item.item_id) fetchStockBalance(item.item_id, siteId);
                                        });
                                    }}
                                    onKeyDown={(e) => handleKeyDown(e, showDestination ? "#dest-input" : "#remarks-input")}
                                    placeholder="Select Source Site"
                                    className="h-8 w-full"
                                />

                            ) : (
                                <div className="h-8 bg-muted rounded w-full" />
                            )}
                        </div>

                        <div className="flex-1 min-w-[180px]">
                            <Label>Destination (To)</Label>
                            {showDestination ? (
                                <Combobox
                                    id="dest-input"
                                    options={filteredDestinationSites
                                        .filter(s => s.is_active || s.id === voucher.destination_site_id)
                                        .map(s => ({ label: `${s.name} (${s.type})`, value: String(s.id) }))}
                                    value={voucher.destination_site_id ? String(voucher.destination_site_id) : ""}
                                    onChange={(val) => setVoucher({ ...voucher, destination_site_id: Number(val) })}
                                    onKeyDown={(e) => handleKeyDown(e, "#remarks-input")}
                                    placeholder="Select Destination Site"
                                    className="h-8 w-full"
                                />

                            ) : (
                                <div className="h-8 bg-muted rounded w-full" />
                            )}
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <Label>Remarks</Label>
                            <Input
                                id="remarks-input"
                                value={voucher.remarks || ""}
                                onChange={(e) => setVoucher({ ...voucher, remarks: e.target.value })}
                                onKeyDown={(e) => handleKeyDown(e, "#item-input-0")}
                                placeholder="Optional remarks"
                                className="h-8 w-full"
                            />

                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="h-10">
                                    <TableHead className="w-[50px] py-1">#</TableHead>
                                    <TableHead className="py-1">Item Name</TableHead>
                                    <TableHead className="w-[120px] py-1">Quantity</TableHead>
                                    <TableHead className="w-[100px] text-right py-1">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {voucher.items?.map((vi, index) => (
                                    <TableRow key={index} className="h-10">
                                        <TableCell className="py-1">{index + 1}</TableCell>
                                        <TableCell className="py-1">
                                            <Combobox
                                                id={`item-input-${index}`}
                                                options={items
                                                    .filter(item => item.is_active || item.id === vi.item_id)
                                                    .map(item => ({
                                                        label: `${item.name}${item.brand_name ? ` - ${item.brand_name}` : ""}${item.model_name ? ` - ${item.model_name}` : ""} (${item.code})`,
                                                        value: String(item.id)
                                                    }))}
                                                value={vi.item_id ? String(vi.item_id) : ""}
                                                onChange={(val) => updateItemRow(index, "item_id", Number(val))}
                                                onKeyDown={(e) => handleKeyDown(e, `#qty-input-${index}`, true)}

                                                placeholder="Select Item"
                                                className="h-8"
                                            />


                                        </TableCell>
                                        <TableCell className="py-1">
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    id={`qty-input-${index}`}
                                                    type="number"
                                                    value={vi.quantity}
                                                    onChange={(e) => updateItemRow(index, "quantity", Number(e.target.value))}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            const isLastRow = index === (voucher.items?.length || 0) - 1;
                                                            if (isLastRow) {
                                                                addItemRow();
                                                                setFocusNewRow(true);
                                                            } else {
                                                                handleKeyDown(e, `#item-input-${index + 1}`);
                                                            }
                                                        }
                                                    }}
                                                    className="h-8 w-20"
                                                />

                                                {voucher.source_site_id && vi.item_id && stockBalances[vi.item_id] !== undefined && (
                                                    <span className="text-xs text-red-500 whitespace-nowrap">
                                                        ({stockBalances[vi.item_id] > 0 ? stockBalances[vi.item_id] : "-"})
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right py-1 space-x-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={addItemRow}
                                                className="h-8 w-8 text-primary hover:bg-primary/10"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeItemRow(index)}
                                                className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                disabled={voucher.items?.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Sticky Bottom Section */}
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 shadow-lg z-50">
                <div className="container flex items-center justify-end gap-3 px-8 mx-auto max-w-full">
                    <Button variant="outline" onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" /> Print
                    </Button>
                    <Button variant="outline" onClick={handleViewHistory} className="gap-2">
                        <Clock className="h-4 w-4" /> History
                    </Button>
                    <div className="w-[1px] h-6 bg-border mx-2" />
                    <Button variant="outline" onClick={handleClear} className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10">
                        <RotateCcw className="h-4 w-4" /> Clear
                    </Button>
                    {isEditMode && (
                        <Button variant="outline" onClick={() => navigate("/transactions")} className="gap-2">
                            <X className="h-4 w-4" /> Cancel
                        </Button>
                    )}
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="h-4 w-4" /> {isEditMode ? "Update" : "Save"}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default StockEntryPage;
