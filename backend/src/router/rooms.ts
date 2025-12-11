import { z } from "zod";
import { protectedProcedure } from "../orpc.js";
import { Room } from "../models/index.js";

export const roomsRouter = {
    list: protectedProcedure
        .input(
            z.object({
                search: z.string().optional(),
                minCapacity: z.number().optional(),
            }).optional()
        )
        .handler(async ({ input }) => {
            const query: Record<string, unknown> = {};
            if (input?.search) {
                query.$or = [
                    { name: { $regex: input.search, $options: "i" } },
                    { location: { $regex: input.search, $options: "i" } },
                ];
            }
            if (input?.minCapacity) {
                query.capacity = { $gte: input.minCapacity };
            }

            return await Room.find(query).sort({ name: 1 });
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const room = await Room.findById(input.id);
            if (!room) {
                throw new Error("Room not found");
            }
            return room;
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string(),
                location: z.string(),
                capacity: z.number(),
                amenities: z.array(z.string()).optional(),
                status: z.enum(["available", "maintenance", "occupied"]).optional(),
                images: z.array(z.string()).optional(),
            })
        )
        .handler(async ({ input }) => {
            const room = await Room.create(input);
            return room;
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().optional(),
                location: z.string().optional(),
                capacity: z.number().optional(),
                amenities: z.array(z.string()).optional(),
                status: z.enum(["available", "maintenance", "occupied"]).optional(),
                images: z.array(z.string()).optional(),
            })
        )
        .handler(async ({ input }) => {
            const room = await Room.findByIdAndUpdate(
                input.id,
                { $set: input },
                { new: true }
            );
            if (!room) {
                throw new Error("Room not found");
            }
            return room;
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const room = await Room.findByIdAndDelete(input.id);
            if (!room) {
                throw new Error("Room not found");
            }
            return { success: true };
        }),
};
