import { z } from "zod";
import { protectedProcedure, adminProcedure } from "../orpc.js";
import { Alert } from "../models/index.js";
import type { Types } from "mongoose";

const alertSchema = z.object({
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.enum(["info", "warning", "error", "success"]).optional(),
    source: z.enum(["manual", "iot", "system"]).optional(),
    targetUsers: z.array(z.string()).optional(), // Empty = broadcast to all
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    metadata: z.record(z.unknown()).optional(),
    expiresAt: z.string().datetime().optional(),
});

export const alertsRouter = {
    // Get alerts for current user
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
                    { targetUsers: { $size: 0 } }, // Broadcast alerts
                    { targetUsers: context.user.userId }, // Targeted alerts
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
                isRead: alert.readBy.some((id: Types.ObjectId) => id.toString() === context.user.userId),
                createdAt: alert.createdAt.toISOString(),
                expiresAt: alert.expiresAt?.toISOString(),
            }));
        }),

    // Get unread count
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

    // Create alert (admin or system only)
    create: adminProcedure
        .input(alertSchema)
        .handler(async ({ input }) => {
            const alert = await Alert.create({
                ...input,
                expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
            });

            return {
                id: alert._id.toString(),
                title: alert.title,
                type: alert.type,
            };
        }),

    // Mark alert as read
    markRead: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input, context }) => {
            await Alert.findByIdAndUpdate(input.id, {
                $addToSet: { readBy: context.user.userId },
            });
            return { success: true };
        }),

    // Mark all alerts as read
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

    // Delete alert (admin only)
    delete: adminProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const alert = await Alert.findByIdAndDelete(input.id);
            if (!alert) {
                throw new Error("Alert not found");
            }
            return { success: true };
        }),

    // Simulate IoT alert (for demo purposes)
    simulateIoT: adminProcedure
        .input(
            z.object({
                sensorType: z.enum(["occupancy", "temperature", "humidity", "motion"]),
                location: z.string(),
                value: z.number(),
            })
        )
        .handler(async ({ input }) => {
            let alertData: {
                title: string;
                message: string;
                type: "info" | "warning" | "error" | "success";
                priority: "low" | "medium" | "high" | "critical";
            };

            switch (input.sensorType) {
                case "occupancy":
                    alertData = {
                        title: `Room ${input.location} Occupancy Alert`,
                        message: `Current occupancy: ${input.value} people`,
                        type: input.value > 50 ? "warning" : "info",
                        priority: input.value > 50 ? "high" : "low",
                    };
                    break;
                case "temperature":
                    alertData = {
                        title: `Temperature Alert - ${input.location}`,
                        message: `Temperature: ${input.value}°C`,
                        type: input.value > 30 || input.value < 15 ? "warning" : "info",
                        priority: input.value > 35 ? "critical" : "medium",
                    };
                    break;
                default:
                    alertData = {
                        title: `Sensor Alert - ${input.location}`,
                        message: `${input.sensorType}: ${input.value}`,
                        type: "info",
                        priority: "low",
                    };
            }

            const alert = await Alert.create({
                ...alertData,
                source: "iot",
                targetUsers: [],
                metadata: {
                    sensorType: input.sensorType,
                    location: input.location,
                    value: input.value,
                },
            });

            return {
                id: alert._id.toString(),
                title: alert.title,
            };
        }),
};
