import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import {
    BarChart3,
    TrendingUp,
    CheckCircle,
    Clock,
    AlertTriangle,
    Users,
    Target,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskMetrics {
    total: number;
    statusCounts: Record<string, number>;
    priorityCounts: Record<string, number>;
    overdueCount: number;
    completionRate: number;
    inProgressRate: number;
    bottlenecks: { reviewBacklog: number; urgentPending: number };
}

interface TeamMetric {
    id: string;
    name: string;
    color?: string;
    memberCount: number;
    taskCount: number;
    completedTasks: number;
    productivityRate: number;
}

export function AnalyticsPage() {
    const [taskMetrics, setTaskMetrics] = useState<TaskMetrics | null>(null);
    const [teamMetrics, setTeamMetrics] = useState<{ totalTeams: number; teams: TeamMetric[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMetrics();
    }, []);

    const fetchMetrics = async () => {
        try {
            setLoading(true);
            const [tasks, , teams] = await Promise.all([
                client.analytics.taskMetrics(),
                client.analytics.eventMetrics(),
                client.analytics.teamMetrics(),
            ]);
            setTaskMetrics(tasks);
            setTeamMetrics(teams);
        } catch (error) {
            console.error("Failed to fetch analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            label: "Task Completion",
            value: `${taskMetrics?.completionRate ?? 0}%`,
            subtitle: `${taskMetrics?.statusCounts?.done ?? 0} of ${taskMetrics?.total ?? 0} tasks`,
            icon: CheckCircle,
            color: "from-emerald-500 to-green-500",
            shadowColor: "shadow-emerald-500/20",
        },
        {
            label: "In Progress",
            value: `${taskMetrics?.inProgressRate ?? 0}%`,
            subtitle: `${taskMetrics?.statusCounts?.["in-progress"] ?? 0} active tasks`,
            icon: Clock,
            color: "from-blue-500 to-cyan-500",
            shadowColor: "shadow-blue-500/20",
        },
        {
            label: "Overdue Tasks",
            value: taskMetrics?.overdueCount ?? 0,
            subtitle: "Needs attention",
            icon: AlertTriangle,
            color: "from-red-500 to-rose-500",
            shadowColor: "shadow-red-500/20",
        },
        {
            label: "Teams",
            value: teamMetrics?.totalTeams ?? 0,
            subtitle: "Active teams",
            icon: Users,
            color: "from-violet-500 to-purple-500",
            shadowColor: "shadow-violet-500/20",
        },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <BarChart3 className="w-7 h-7 text-violet-400" />
                    Analytics
                </h1>
                <p className="text-gray-400 mt-1">Track your team's performance and productivity</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm">{stat.label}</p>
                                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                                    <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                                </div>
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                                    stat.color,
                                    stat.shadowColor
                                )}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Task Status Distribution */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Task Distribution
                    </h2>
                    <div className="space-y-4">
                        {["todo", "in-progress", "review", "done"].map((status) => {
                            const count = taskMetrics?.statusCounts?.[status] ?? 0;
                            const total = taskMetrics?.total ?? 1;
                            const percentage = Math.round((count / total) * 100) || 0;
                            const colors: Record<string, string> = {
                                todo: "bg-gray-500",
                                "in-progress": "bg-blue-500",
                                review: "bg-amber-500",
                                done: "bg-emerald-500",
                            };
                            const labels: Record<string, string> = {
                                todo: "To Do",
                                "in-progress": "In Progress",
                                review: "Review",
                                done: "Done",
                            };
                            return (
                                <div key={status}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-400">{labels[status]}</span>
                                        <span className="text-white font-medium">{count} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500", colors[status])}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Bottlenecks */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        Bottlenecks
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                            <div>
                                <p className="text-white font-medium">Review Backlog</p>
                                <p className="text-sm text-gray-400">Tasks waiting for review</p>
                            </div>
                            <span className="text-2xl font-bold text-amber-400">
                                {taskMetrics?.bottlenecks?.reviewBacklog ?? 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                            <div>
                                <p className="text-white font-medium">Urgent Tasks Pending</p>
                                <p className="text-sm text-gray-400">High priority incomplete</p>
                            </div>
                            <span className="text-2xl font-bold text-red-400">
                                {taskMetrics?.bottlenecks?.urgentPending ?? 0}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Team Productivity */}
                <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 lg:col-span-2">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                        Team Productivity
                    </h2>
                    {teamMetrics?.teams && teamMetrics.teams.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamMetrics.teams.map((team) => (
                                <div
                                    key={team.id}
                                    className="p-4 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                                            style={{ backgroundColor: team.color ?? "#8b5cf6" }}
                                        >
                                            {team.name[0]}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{team.name}</p>
                                            <p className="text-xs text-gray-500">{team.memberCount} members</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-400">Productivity</span>
                                            <span className={cn(
                                                "font-medium",
                                                team.productivityRate >= 70 ? "text-emerald-400" :
                                                    team.productivityRate >= 40 ? "text-amber-400" : "text-red-400"
                                            )}>
                                                {team.productivityRate}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    team.productivityRate >= 70 ? "bg-emerald-500" :
                                                        team.productivityRate >= 40 ? "bg-amber-500" : "bg-red-500"
                                                )}
                                                style={{ width: `${team.productivityRate}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            {team.completedTasks} / {team.taskCount} tasks completed
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            No team data available yet
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
