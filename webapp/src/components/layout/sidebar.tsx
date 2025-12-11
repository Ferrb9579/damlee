import { Link, useLocation } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/auth-store";
import {
    LayoutDashboard,
    Calendar,
    CheckSquare,
    Users,
    Bell,
    BarChart3,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Settings,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/calendar", label: "Calendar", icon: Calendar },
    { path: "/tasks", label: "Tasks", icon: CheckSquare },
    { path: "/teams", label: "Teams", icon: Users },
    { path: "/alerts", label: "Alerts", icon: Bell },
    { path: "/analytics", label: "Analytics", icon: BarChart3 },
];

export function Sidebar() {
    const location = useLocation();
    const { user, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside
            className={cn(
                "h-screen sticky top-0 flex flex-col bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/5 transition-all duration-300",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-white/5">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <span className="text-white font-bold text-lg">S</span>
                        </div>
                        <div>
                            <h1 className="font-bold text-white">Smart Mgmt</h1>
                            <p className="text-xs text-gray-500">Coordination System</p>
                        </div>
                    </div>
                )}
                {collapsed && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto">
                        <span className="text-white font-bold text-lg">S</span>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-gradient-to-r from-violet-600/20 to-purple-600/20 text-white border border-violet-500/30"
                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-5 h-5 flex-shrink-0 transition-colors",
                                    isActive ? "text-violet-400" : "group-hover:text-violet-400"
                                )}
                            />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-white/5">
                {!collapsed && user && (
                    <div className="mb-3 px-3 py-2 rounded-xl bg-white/5">
                        <p className="text-sm font-medium text-white truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                )}
                <div className={cn("flex gap-2", collapsed ? "flex-col" : "")}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </Button>
                    {!collapsed && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            <Settings className="w-5 h-5" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={logout}
                        className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                        <LogOut className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </aside>
    );
}
