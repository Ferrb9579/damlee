import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import { Bell, Check, CheckCheck, AlertTriangle, Info, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Alert {
    id: string;
    title: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
    source: "manual" | "iot" | "system";
    priority: "low" | "medium" | "high" | "critical";
    isRead: boolean;
    createdAt: string;
}

const typeIcons = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
};

const typeColors = {
    info: "from-blue-500 to-cyan-500 shadow-blue-500/20",
    warning: "from-amber-500 to-orange-500 shadow-amber-500/20",
    error: "from-red-500 to-rose-500 shadow-red-500/20",
    success: "from-emerald-500 to-green-500 shadow-emerald-500/20",
};

const priorityBadges = {
    low: "bg-gray-500/20 text-gray-400",
    medium: "bg-blue-500/20 text-blue-400",
    high: "bg-orange-500/20 text-orange-400",
    critical: "bg-red-500/20 text-red-400 animate-pulse",
};

export function AlertsPage() {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchAlerts();
        fetchUnreadCount();
    }, []);

    const fetchAlerts = async () => {
        try {
            setLoading(true);
            const data = await client.alerts.list({ limit: 50 });
            setAlerts(data);
        } catch (error) {
            console.error("Failed to fetch alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const { count } = await client.alerts.unreadCount();
            setUnreadCount(count);
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        try {
            await client.alerts.markRead({ id });
            setAlerts(alerts.map(a => a.id === id ? { ...a, isRead: true } : a));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error("Failed to mark alert as read:", error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await client.alerts.markAllRead();
            setAlerts(alerts.map(a => ({ ...a, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all alerts as read:", error);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Bell className="w-7 h-7 text-orange-400" />
                        Alerts
                        {unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-sm bg-orange-500/20 text-orange-400 rounded-full">
                                {unreadCount} unread
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-400 mt-1">Stay updated with notifications and alerts</p>
                </div>
                {unreadCount > 0 && (
                    <Button
                        onClick={handleMarkAllAsRead}
                        variant="outline"
                        className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                    >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        Mark All Read
                    </Button>
                )}
            </div>

            {/* Alerts List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="text-center py-20">
                    <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No alerts</h3>
                    <p className="text-gray-400">You're all caught up!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => {
                        const Icon = typeIcons[alert.type];
                        return (
                            <div
                                key={alert.id}
                                className={cn(
                                    "group rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-4 transition-all duration-300",
                                    !alert.isRead && "border-l-4",
                                    !alert.isRead && alert.type === "info" && "border-l-blue-500",
                                    !alert.isRead && alert.type === "warning" && "border-l-amber-500",
                                    !alert.isRead && alert.type === "error" && "border-l-red-500",
                                    !alert.isRead && alert.type === "success" && "border-l-emerald-500"
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-lg",
                                        typeColors[alert.type]
                                    )}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <h3 className={cn(
                                                    "font-semibold",
                                                    alert.isRead ? "text-gray-400" : "text-white"
                                                )}>
                                                    {alert.title}
                                                </h3>
                                                <p className="text-gray-500 text-sm mt-1">{alert.message}</p>
                                            </div>
                                            {!alert.isRead && (
                                                <Button
                                                    onClick={() => handleMarkAsRead(alert.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-3">
                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded-full capitalize",
                                                priorityBadges[alert.priority]
                                            )}>
                                                {alert.priority}
                                            </span>
                                            <span className="text-xs text-gray-500 capitalize">
                                                {alert.source}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
