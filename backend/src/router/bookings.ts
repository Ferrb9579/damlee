import { z } from "zod";
import { protectedProcedure } from "../orpc.js";
import { Booking, Room } from "../models/index.js";

export const bookingsRouter = {
    list: protectedProcedure
        .input(
            z.object({
                roomId: z.string().optional(),
                startDate: z.string().datetime().optional(),
                endDate: z.string().datetime().optional(),
            }).optional()
        )
        .handler(async ({ input }) => {
            const query: Record<string, unknown> = {};
            if (input?.roomId) query.room = input.roomId;

            if (input?.startDate || input?.endDate) {
                query.startTime = {};
                if (input.startDate) (query.startTime as any).$gte = new Date(input.startDate);
                if (input.endDate) (query.startTime as any).$lte = new Date(input.endDate);
            }

            return await Booking.find(query)
                .populate("room")
                .populate("organizer", "name email")
                .populate("attendees", "name email")
                .sort({ startTime: 1 });
        }),

    create: protectedProcedure
        .input(
            z.object({
                title: z.string(),
                description: z.string().optional(),
                roomId: z.string(),
                attendees: z.array(z.string()).optional(),
                startTime: z.string().datetime(),
                endTime: z.string().datetime(),
            })
        )
        .handler(async ({ input, context }) => {
            const start = new Date(input.startTime);
            const end = new Date(input.endTime);

            // Check if room exists
            const room = await Room.findById(input.roomId);
            if (!room) {
                throw new Error("Room not found");
            }

            // Check for overlaps
            const overlap = await Booking.findOne({
                room: input.roomId,
                status: { $ne: "cancelled" },
                $or: [
                    { startTime: { $lt: end }, endTime: { $gt: start } },
                ],
            });

            if (overlap) {
                throw new Error("Room is already booked for this time slot");
            }

            const booking = await Booking.create({
                ...input,
                organizer: context.user.userId,
                status: "confirmed",
            });

            return booking;
        }),

    cancel: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input, context }) => {
            const booking = await Booking.findOne({
                _id: input.id,
                organizer: context.user.userId,
            });

            if (!booking) {
                throw new Error("Booking not found or authorized");
            }

            booking.status = "cancelled";
            await booking.save();
            return { success: true };
        }),
};
