import { z } from "zod";
import { protectedProcedure } from "../orpc.js";
import { Task, Event, Team, User, Asset } from "../models/index.js";

export const analyticsRouter = {
    // Task metrics
    taskMetrics: protectedProcedure
        .input(
            z.object({
                teamId: z.string().optional(),
                startDate: z.string().datetime().optional(),
                endDate: z.string().datetime().optional(),
            }).optional()
        )
        .handler(async ({ input }) => {
            const query: Record<string, unknown> = {};
            if (input?.teamId) query["team"] = input.teamId;

            const tasks = await Task.find(query);

            const statusCounts = {
                todo: 0,
                "in-progress": 0,
                review: 0,
                done: 0,
            };

            const priorityCounts = {
                low: 0,
                medium: 0,
                high: 0,
                urgent: 0,
            };

            let overdueCount = 0;
            const now = new Date();

            tasks.forEach((task) => {
                statusCounts[task.status]++;
                priorityCounts[task.priority]++;
                if (task.dueDate && task.dueDate < now && task.status !== "done") {
                    overdueCount++;
                }
            });

            const total = tasks.length;
            const completionRate = total > 0 ? (statusCounts.done / total) * 100 : 0;
            const inProgressRate = total > 0 ? (statusCounts["in-progress"] / total) * 100 : 0;

            return {
                total,
                statusCounts,
                priorityCounts,
                overdueCount,
                completionRate: Math.round(completionRate * 100) / 100,
                inProgressRate: Math.round(inProgressRate * 100) / 100,
                bottlenecks: {
                    reviewBacklog: statusCounts.review,
                    urgentPending: priorityCounts.urgent - (await Task.countDocuments({ priority: "urgent", status: "done" })),
                },
            };
        }),

    // Event metrics
    eventMetrics: protectedProcedure
        .input(
            z.object({
                startDate: z.string().datetime().optional(),
                endDate: z.string().datetime().optional(),
            }).optional()
        )
        .handler(async ({ input }) => {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const startDate = input?.startDate ? new Date(input.startDate) : startOfMonth;
            const endDate = input?.endDate ? new Date(input.endDate) : endOfMonth;

            const events = await Event.find({
                start: { $gte: startDate, $lte: endDate },
            });

            const statusCounts = {
                scheduled: 0,
                "in-progress": 0,
                completed: 0,
                cancelled: 0,
            };

            events.forEach((event) => {
                statusCounts[event.status]++;
            });

            const total = events.length;

            // Get upcoming events count (next 7 days)
            const next7Days = new Date();
            next7Days.setDate(next7Days.getDate() + 7);
            const upcomingCount = await Event.countDocuments({
                start: { $gte: now, $lte: next7Days },
                status: "scheduled",
            });

            return {
                total,
                statusCounts,
                upcomingCount,
                completionRate: total > 0 ? Math.round((statusCounts.completed / total) * 100) : 0,
                cancellationRate: total > 0 ? Math.round((statusCounts.cancelled / total) * 100) : 0,
            };
        }),

    // Team metrics
    teamMetrics: protectedProcedure.handler(async () => {
        const teams = await Team.find().populate("members", "_id");
        const teamStats = await Promise.all(
            teams.map(async (team) => {
                const taskCount = await Task.countDocuments({ team: team._id });
                const completedTasks = await Task.countDocuments({
                    team: team._id,
                    status: "done",
                });

                return {
                    id: team._id.toString(),
                    name: team.name,
                    color: team.color,
                    memberCount: team.members.length,
                    taskCount,
                    completedTasks,
                    productivityRate: taskCount > 0 ? Math.round((completedTasks / taskCount) * 100) : 0,
                };
            })
        );

        return {
            totalTeams: teams.length,
            teams: teamStats.sort((a, b) => b.productivityRate - a.productivityRate),
        };
    }),

    // Dashboard summary
    dashboardSummary: protectedProcedure.handler(async ({ context }) => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfToday = new Date(startOfToday);
        endOfToday.setDate(endOfToday.getDate() + 1);

        // Today's events
        const todayEvents = await Event.countDocuments({
            start: { $gte: startOfToday, $lt: endOfToday },
        });

        // My pending tasks
        const myPendingTasks = await Task.countDocuments({
            assignee: context.user.userId,
            status: { $in: ["todo", "in-progress", "review"] },
        });

        // Overdue tasks
        const overdueTasks = await Task.countDocuments({
            assignee: context.user.userId,
            dueDate: { $lt: now },
            status: { $ne: "done" },
        });

        // Total users
        const totalUsers = await User.countDocuments();

        // Total teams
        const totalTeams = await Team.countDocuments();

        // Recent activity (tasks completed this week)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const tasksCompletedThisWeek = await Task.countDocuments({
            status: "done",
            updatedAt: { $gte: startOfWeek },
        });

        // Inventory Stats
        const totalAssets = await Asset.countDocuments();
        const lowStockItems = await Asset.countDocuments({
            $expr: { $lte: ["$quantity", "$minQuantity"] },
        });

        return {
            todayEvents,
            myPendingTasks,
            overdueTasks,
            totalUsers,
            totalTeams,
            tasksCompletedThisWeek,
            totalAssets,
            lowStockItems,
        };
    }),
};
