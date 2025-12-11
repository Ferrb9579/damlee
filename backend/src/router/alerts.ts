import { z } from "zod";
import { protectedProcedure, adminProcedure } from "../orpc.js";
import { Alert } from "../models/index.js";

const alertSchema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.enum(["info", "warning", "error", "success"]).optional(),
    source: z.enum(["manual", "iot", "system"]).optional(),
    targetUsers: z.array(z.string()).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    expiresAt: z.string().datetime().optional(),
});

export const alertsRouter = {
    list: protectedProcedure
        .input(
            z.object({
                unreadOnly: z.boolean().optional(),
                limit: z.number().min(1).max(100).optional(),
            }).optional()
        )
        .handler(async ({ input, context }) => {
            const query: Record<string, unknown> = {
                $or: [
                    { targetUsers: { $size: 0 } },
                    { targetUsers: context.user.userId },
                ],
            };

            if (input?.unreadOnly) {
                query["readBy"] = { $ne: context.user.userId };
            }

            const alerts = await Alert.find(query)
                .sort({ createdAt: -1 })
                .limit(input?.limit ?? 50);

            return alerts.map((alert) => ({
                id: alert._id.toString(),
                title: alert.title,
                message: alert.message,
                type: alert.type,
                source: alert.source,
                priority: alert.priority,
                metadata: alert.metadata,
                isRead: alert.readBy.some((id) => id.toString() === context.user.userId),
                createdAt: alert.createdAt.toISOString(),
                expiresAt: alert.expiresAt?.toISOString(),
            }));
        }),

    unreadCount: protectedProcedure.handler(async ({ context }) => {
        const count = await Alert.countDocuments({
            $or: [
                { targetUsers: { $size: 0 } },
                { targetUsers: context.user.userId },
            ],
            readBy: { $ne: context.user.userId },
        });
        return { count };
    }),

    create: adminProcedure
        .input(alertSchema)
        .handler(async ({ input }) => {
            const newAlert = new Alert({
                title: input.title,
                message: input.message,
                type: input.type || "info",
                source: input.source || "manual",
                targetUsers: input.targetUsers || [],
                priority: input.priority || "medium",
                metadata: input.metadata,
                expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
            });

            const alert = await newAlert.save();

            return {
                id: alert._id.toString(),
                title: alert.title,
                type: alert.type,
            };
        }),

    markRead: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input, context }) => {
            await Alert.findByIdAndUpdate(input.id, {
                $addToSet: { readBy: context.user.userId },
            });
            return { success: true };
        }),

    markAllRead: protectedProcedure.handler(async ({ context }) => {
        await Alert.updateMany(
            {
                $or: [
                    { targetUsers: { $size: 0 } },
                    { targetUsers: context.user.userId },
                ],
                readBy: { $ne: context.user.userId },
            },
            { $addToSet: { readBy: context.user.userId } }
        );
        return { success: true };
    }),

    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const alert = await Alert.findByIdAndDelete(input.id);
            if (!alert) throw new Error("Alert not found");
            return { success: true };
        }),

    simulateIoT: adminProcedure
        .input(
            z.object({
                sensorType: z.enum(["occupancy", "temperature", "humidity", "motion"]),
                location: z.string(),
                value: z.number(),
            })
        )
        .handler(async ({ input }) => {
            let title: string;
            let message: string;
            let type: "info" | "warning" = "info";
            let priority: "low" | "medium" | "high" | "critical" = "low";

            switch (input.sensorType) {
                case "occupancy":
                    title = `Room ${input.location} Occupancy Alert`;
                    message = `Current occupancy: ${input.value} people`;
                    type = input.value > 50 ? "warning" : "info";
                    priority = input.value > 50 ? "high" : "low";
                    break;
                case "temperature":
                    title = `Temperature Alert - ${input.location}`;
                    message = `Temperature: ${input.value}°C`;
                    type = input.value > 30 || input.value < 15 ? "warning" : "info";
                    priority = input.value > 35 ? "critical" : "medium";
                    break;
                default:
                    title = `Sensor Alert - ${input.location}`;
                    message = `${input.sensorType}: ${input.value}`;
            }

            const newAlert = new Alert({
                title,
                message,
                type,
                priority,
                source: "iot",
                targetUsers: [],
                metadata: {
                    sensorType: input.sensorType,
                    location: input.location,
                    value: input.value,
                },
            });

            const alert = await newAlert.save();

            return {
                id: alert._id.toString(),
                title: alert.title,
            };
        }),
};
