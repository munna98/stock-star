import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Layout() {
    const location = useLocation();

    const navItems = [
        { path: "/", label: "Dashboard" },
        { path: "/items", label: "Items" },
        { path: "/brands", label: "Brands" },
        { path: "/models", label: "Models" },
        { path: "/sites", label: "Sites" },
        { path: "/inventory-vouchers", label: "Transactions" },
    ];

    return (
        <div className="flex flex-col h-screen bg-background">
            <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between px-8">
                    <div className="flex items-center gap-6 md:gap-10">
                        <Link to="/" className="flex items-center space-x-2">
                            <span className="inline-block font-bold text-2xl bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                Stock Star
                            </span>
                        </Link>
                        <nav className="flex items-center space-x-2 text-sm font-medium">
                            {navItems.map((item) => (
                                <Button
                                    key={item.path}
                                    asChild
                                    variant={location.pathname === item.path ? "default" : "ghost"}
                                    className={cn(
                                        "transition-colors",
                                        location.pathname === item.path
                                            ? ""
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Link to={item.path}>{item.label}</Link>
                                </Button>
                            ))}
                        </nav>
                    </div>
                </div>
            </nav>
            <main className="flex-1 overflow-y-auto p-8">
                <Outlet />
            </main>
        </div>
    );
}

export default Layout;
