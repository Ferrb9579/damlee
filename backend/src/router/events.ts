import { z } from "zod";
import { protectedProcedure } from "../orpc.js";
import { Event } from "../models/index.js";

const eventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    start: z.string().datetime(),
    end: z.string().datetime(),
    location: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]).optional(),
    color: z.string().optional(),
    reminders: z.array(z.string().datetime()).optional(),
});

export const eventsRouter = {
    list: protectedProcedure
        .input(
            z.object({
                start: z.string().datetime().optional(),
                end: z.string().datetime().optional(),
                status: z.enum(["scheduled", "in-progress", "completed", "cancelled"]).optional(),
            }).optional()
        )
        .handler(async ({ input, context }) => {
            const query: Record<string, unknown> = {};

            if (input?.start && input?.end) {
                query["$or"] = [
                    { start: { $gte: new Date(input.start), $lte: new Date(input.end) } },
                    { end: { $gte: new Date(input.start), $lte: new Date(input.end) } },
                    { start: { $lte: new Date(input.start) }, end: { $gte: new Date(input.end) } },
                ];
            }

            if (input?.status) {
                query["status"] = input.status;
            }

            const events = await Event.find(query)
                .populate("createdBy", "name email")
                .populate("attendees", "name email")
                .sort({ start: 1 });

            return events.map((event) => ({
                id: event._id.toString(),
                title: event.title,
                description: event.description,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                location: event.location,
                createdBy: event.createdBy,
                attendees: event.attendees,
                status: event.status,
                color: event.color,
                reminders: event.reminders?.map((r) => r.toISOString()),
            }));
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const event = await Event.findById(input.id)
                .populate("createdBy", "name email")
                .populate("attendees", "name email");

            if (!event) {
                throw new Error("Event not found");
            }

            return {
                id: event._id.toString(),
                title: event.title,
                description: event.description,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                location: event.location,
                createdBy: event.createdBy,
                attendees: event.attendees,
                status: event.status,
                color: event.color,
                reminders: event.reminders?.map((r) => r.toISOString()),
            };
        }),

    create: protectedProcedure
        .input(eventSchema)
        .handler(async ({ input, context }) => {
            const event = await Event.create({
                ...input,
                start: new Date(input.start),
                end: new Date(input.end),
                reminders: input.reminders?.map((r) => new Date(r)),
                createdBy: context.user.userId,
            });

            return {
                id: event._id.toString(),
                title: event.title,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                status: event.status,
            };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: eventSchema.partial(),
            })
        )
        .handler(async ({ input }) => {
            const updateData: Record<string, unknown> = { ...input.data };
            if (input.data.start) updateData["start"] = new Date(input.data.start);
            if (input.data.end) updateData["end"] = new Date(input.data.end);
            if (input.data.reminders) {
                updateData["reminders"] = input.data.reminders.map((r) => new Date(r));
            }

            const event = await Event.findByIdAndUpdate(input.id, { $set: updateData }, { new: true });

            if (!event) {
                throw new Error("Event not found");
            }

            return {
                id: event._id.toString(),
                title: event.title,
                start: event.start.toISOString(),
                end: event.end.toISOString(),
                status: event.status,
            };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const event = await Event.findByIdAndDelete(input.id);
            if (!event) {
                throw new Error("Event not found");
            }
            return { success: true };
        }),

    // Check for conflicts
    checkConflicts: protectedProcedure
        .input(
            z.object({
                start: z.string().datetime(),
                end: z.string().datetime(),
                excludeId: z.string().optional(),
            })
        )
        .handler(async ({ input }) => {
            const query: Record<string, unknown> = {
                $or: [
                    { start: { $lt: new Date(input.end), $gte: new Date(input.start) } },
                    { end: { $gt: new Date(input.start), $lte: new Date(input.end) } },
                    { start: { $lte: new Date(input.start) }, end: { $gte: new Date(input.end) } },
                ],
            };

            if (input.excludeId) {
                query["_id"] = { $ne: input.excludeId };
            }

            const conflicts = await Event.find(query).select("title start end");
            return conflicts.map((e) => ({
                id: e._id.toString(),
                title: e.title,
                start: e.start.toISOString(),
                end: e.end.toISOString(),
            }));
        }),
};
