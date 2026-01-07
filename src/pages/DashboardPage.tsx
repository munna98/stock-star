import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getDashboardStats,
    DashboardStats,
    getInventoryVouchers,
    InventoryVoucherDisplay
} from "../api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Package,
    MapPin,
    History,
    PlusCircle,
    BarChart3,
    ArrowRight
} from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

export default function DashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<InventoryVoucherDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const [statsData, vouchersData] = await Promise.all([
                    getDashboardStats(),
                    getInventoryVouchers(1, 5)
                ]);
                setStats(statsData);
                setRecentTransactions(vouchersData.items);
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const statCards = [
        {
            title: "Active Items",
            value: stats?.active_items_count ?? 0,
            icon: Package,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            title: "Active Sites",
            value: stats?.active_sites_count ?? 0,
            icon: MapPin,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            title: "Recent Transactions",
            description: "Last 7 days",
            value: stats?.recent_transactions_count ?? 0,
            icon: History,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of your inventory and recent activities for {formatDate(new Date().toISOString())}
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {statCards.map((card) => (
                    <Card key={card.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {card.title}
                            </CardTitle>
                            <div className={`${card.bg} p-2 rounded-full`}>
                                <card.icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{loading ? "..." : card.value}</div>
                            {card.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {card.description}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <Button
                            className="w-full justify-start gap-3 h-12"
                            variant="outline"
                            onClick={() => navigate("/inventory-vouchers")}
                        >
                            <PlusCircle className="h-5 w-5 text-blue-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">New Stock Entry</span>
                                <span className="text-[10px] text-muted-foreground">Add new purchase or transfer vouchers</span>
                            </div>
                        </Button>
                        <Button
                            className="w-full justify-start gap-3 h-12"
                            variant="outline"
                            onClick={() => navigate("/stock-balance")}
                        >
                            <BarChart3 className="h-5 w-5 text-green-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">View Stock Balance</span>
                                <span className="text-[10px] text-muted-foreground">Check current inventory levels across sites</span>
                            </div>
                        </Button>
                        <Button
                            className="w-full justify-start gap-3 h-12"
                            variant="outline"
                            onClick={() => navigate("/transactions")}
                        >
                            <History className="h-5 w-5 text-purple-500" />
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-sm">Transaction History</span>
                                <span className="text-[10px] text-muted-foreground">Review and manage past transactions</span>
                            </div>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary/80 gap-1 px-2"
                            onClick={() => navigate("/transactions")}
                        >
                            View All <ArrowRight className="h-3 w-3" />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="py-2 px-4 h-9">Date</TableHead>
                                    <TableHead className="py-2 px-4 h-9">Trans. No</TableHead>
                                    <TableHead className="py-2 px-4 h-9">Type</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                                    </TableRow>
                                ) : recentTransactions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No transactions yet</TableCell>
                                    </TableRow>
                                ) : (
                                    recentTransactions.map((t) => (
                                        <TableRow key={t.id} className="cursor-pointer hover:bg-muted/20" onClick={() => navigate(`/inventory-vouchers?edit_id=${t.id}`)}>
                                            <TableCell className="py-2 px-4 text-sm whitespace-nowrap">{formatDate(t.voucher_date)}</TableCell>
                                            <TableCell className="py-2 px-4 text-sm font-medium">{t.transaction_number}</TableCell>
                                            <TableCell className="py-2 px-4 text-sm">{t.voucher_type_name}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
