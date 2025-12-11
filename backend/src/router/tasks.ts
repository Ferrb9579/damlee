import { z } from "zod";
import { protectedProcedure } from "../orpc.js";
import { Task, type TaskStatus } from "../models/index.js";

const taskSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(["todo", "in-progress", "review", "done"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    assignee: z.string().nullable().optional(),
    dueDate: z.string().datetime().nullable().optional(),
    team: z.string().nullable().optional(),
    labels: z.array(z.string()).optional(),
});

export const tasksRouter = {
    list: protectedProcedure
        .input(
            z.object({
                status: z.enum(["todo", "in-progress", "review", "done"]).optional(),
                assignee: z.string().optional(),
                team: z.string().optional(),
                priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
            }).optional()
        )
        .handler(async ({ input }) => {
            const query: Record<string, unknown> = {};

            if (input?.status) query["status"] = input.status;
            if (input?.assignee) query["assignee"] = input.assignee;
            if (input?.team) query["team"] = input.team;
            if (input?.priority) query["priority"] = input.priority;

            const tasks = await Task.find(query)
                .populate("assignee", "name email avatar")
                .populate("createdBy", "name email")
                .populate("team", "name color")
                .sort({ status: 1, order: 1, createdAt: -1 });

            return tasks.map((task) => ({
                id: task._id.toString(),
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee,
                createdBy: task.createdBy,
                dueDate: task.dueDate?.toISOString(),
                team: task.team,
                labels: task.labels,
                order: task.order,
                createdAt: task.createdAt.toISOString(),
            }));
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const task = await Task.findById(input.id)
                .populate("assignee", "name email avatar")
                .populate("createdBy", "name email")
                .populate("team", "name color");

            if (!task) {
                throw new Error("Task not found");
            }

            return {
                id: task._id.toString(),
                title: task.title,
                description: task.description,
                status: task.status,
                priority: task.priority,
                assignee: task.assignee,
                createdBy: task.createdBy,
                dueDate: task.dueDate?.toISOString(),
                team: task.team,
                labels: task.labels,
                order: task.order,
                createdAt: task.createdAt.toISOString(),
            };
        }),

    create: protectedProcedure
        .input(taskSchema)
        .handler(async ({ input, context }) => {
            // Get max order for the status
            const maxOrderTask = await Task.findOne({ status: input.status ?? "todo" })
                .sort({ order: -1 })
                .select("order");
            const order = (maxOrderTask?.order ?? 0) + 1;

            const task = await Task.create({
                ...input,
                dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
                createdBy: context.user.userId,
                order,
            });

            return {
                id: task._id.toString(),
                title: task.title,
                status: task.status,
                priority: task.priority,
                order: task.order,
            };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: taskSchema.partial(),
            })
        )
        .handler(async ({ input }) => {
            const updateData: Record<string, unknown> = { ...input.data };
            if (input.data.dueDate !== undefined) {
                updateData["dueDate"] = input.data.dueDate ? new Date(input.data.dueDate) : null;
            }

            const task = await Task.findByIdAndUpdate(input.id, { $set: updateData }, { new: true });

            if (!task) {
                throw new Error("Task not found");
            }

            return {
                id: task._id.toString(),
                title: task.title,
                status: task.status,
                priority: task.priority,
            };
        }),

    // Quick status update for Kanban drag & drop
    updateStatus: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                status: z.enum(["todo", "in-progress", "review", "done"]),
                order: z.number(),
            })
        )
        .handler(async ({ input }) => {
            // Update the moved task
            const task = await Task.findByIdAndUpdate(
                input.id,
                { $set: { status: input.status, order: input.order } },
                { new: true }
            );

            if (!task) {
                throw new Error("Task not found");
            }

            return {
                id: task._id.toString(),
                status: task.status,
                order: task.order,
            };
        }),

    // Reorder tasks within a column
    reorder: protectedProcedure
        .input(
            z.object({
                tasks: z.array(
                    z.object({
                        id: z.string(),
                        order: z.number(),
                    })
                ),
            })
        )
        .handler(async ({ input }) => {
            await Promise.all(
                input.tasks.map((t) =>
                    Task.findByIdAndUpdate(t.id, { $set: { order: t.order } })
                )
            );
            return { success: true };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const task = await Task.findByIdAndDelete(input.id);
            if (!task) {
                throw new Error("Task not found");
            }
            return { success: true };
        }),

    // Get tasks grouped by status for Kanban view
    kanban: protectedProcedure
        .input(z.object({ team: z.string().optional() }).optional())
        .handler(async ({ input }) => {
            const query: Record<string, unknown> = {};
            if (input?.team) query["team"] = input.team;

            const tasks = await Task.find(query)
                .populate("assignee", "name email avatar")
                .populate("team", "name color")
                .sort({ order: 1 });

            const grouped: Record<TaskStatus, typeof tasks> = {
                "todo": [],
                "in-progress": [],
                "review": [],
                "done": [],
            };

            tasks.forEach((task) => {
                grouped[task.status].push(task);
            });

            return {
                todo: grouped["todo"].map((t) => ({
                    id: t._id.toString(),
                    title: t.title,
                    description: t.description,
                    priority: t.priority,
                    assignee: t.assignee,
                    dueDate: t.dueDate?.toISOString(),
                    labels: t.labels,
                    order: t.order,
                })),
                "in-progress": grouped["in-progress"].map((t) => ({
                    id: t._id.toString(),
                    title: t.title,
                    description: t.description,
                    priority: t.priority,
                    assignee: t.assignee,
                    dueDate: t.dueDate?.toISOString(),
                    labels: t.labels,
                    order: t.order,
                })),
                review: grouped["review"].map((t) => ({
                    id: t._id.toString(),
                    title: t.title,
                    description: t.description,
                    priority: t.priority,
                    assignee: t.assignee,
                    dueDate: t.dueDate?.toISOString(),
                    labels: t.labels,
                    order: t.order,
                })),
                done: grouped["done"].map((t) => ({
                    id: t._id.toString(),
                    title: t.title,
                    description: t.description,
                    priority: t.priority,
                    assignee: t.assignee,
                    dueDate: t.dueDate?.toISOString(),
                    labels: t.labels,
                    order: t.order,
                })),
            };
        }),
};
