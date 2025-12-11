import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import {
    Calendar,
    CheckSquare,
    AlertTriangle,
    Users,
    TrendingUp,
    Clock,
    ArrowUpRight,
    Plus,
    Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

interface DashboardSummary {
    todayEvents: number;
    myPendingTasks: number;
    overdueTasks: number;
    totalUsers: number;
    totalTeams: number;
    tasksCompletedThisWeek: number;
    totalAssets: number;
    lowStockItems: number;
}

export function DashboardPage() {
    const { user } = useAuthStore();
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await client.analytics.dashboardSummary();
                setSummary(data);
            } catch (error) {
                console.error("Failed to fetch dashboard summary:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSummary();
    }, []);

    const stats = [
        {
            label: "Today's Events",
            value: summary?.todayEvents ?? 0,
            icon: Calendar,
            color: "from-blue-500 to-cyan-500",
            shadowColor: "shadow-blue-500/20",
        },
        {
            label: "Pending Tasks",
            value: summary?.myPendingTasks ?? 0,
            icon: CheckSquare,
            color: "from-violet-500 to-purple-500",
            shadowColor: "shadow-violet-500/20",
        },
        {
            label: "Overdue Tasks",
            value: summary?.overdueTasks ?? 0,
            icon: AlertTriangle,
            color: "from-orange-500 to-red-500",
            shadowColor: "shadow-orange-500/20",
        },
        {
            label: "Low Stock Items",
            value: summary?.lowStockItems ?? 0,
            icon: Package,
            color: "from-red-500 to-pink-500",
            shadowColor: "shadow-red-500/20",
        },
    ];

    const quickActions = [
        { label: "New Event", icon: Calendar, to: "/calendar", color: "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" },
        { label: "New Task", icon: CheckSquare, to: "/tasks", color: "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20" },
        { label: "Add Asset", icon: Package, to: "/inventory", color: "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20" },
        { label: "View Alerts", icon: AlertTriangle, to: "/alerts", color: "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400">{user?.name}</span>
                </h1>
                <p className="text-gray-400">Here's what's happening with your projects today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className={`relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10`}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm mb-1">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white">
                                        {loading ? "..." : stat.value}
                                    </p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadowColor}`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-white/5 to-transparent" />
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="lg:col-span-1 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Plus className="w-5 h-5 text-violet-400" />
                        Quick Actions
                    </h2>
                    <div className="space-y-3">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link
                                    key={action.label}
                                    to={action.to}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${action.color}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{action.label}</span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 opacity-50" />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Weekly Progress */}
                <div className="lg:col-span-2 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Weekly Progress
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <CheckSquare className="w-5 h-5 text-emerald-400" />
                                <span className="text-gray-400 text-sm">Tasks Completed</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {loading ? "..." : summary?.tasksCompletedThisWeek ?? 0}
                            </p>
                            <p className="text-xs text-emerald-400 mt-1">This week</p>
                        </div>
                        <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
                            <div className="flex items-center gap-3 mb-2">
                                <Users className="w-5 h-5 text-blue-400" />
                                <span className="text-gray-400 text-sm">Total Users</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                                {loading ? "..." : summary?.totalUsers ?? 0}
                            </p>
                            <p className="text-xs text-blue-400 mt-1">Active members</p>
                        </div>
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-white/5 flex items-center justify-center">
                        <div className="text-center">
                            <Clock className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                            <p className="text-gray-400 text-sm">More analytics coming soon</p>
                            <Link to="/analytics">
                                <Button variant="link" className="text-violet-400 hover:text-violet-300 p-0 h-auto mt-1">
                                    View full analytics →
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
