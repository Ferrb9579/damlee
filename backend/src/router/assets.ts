import { z } from "zod";
import { protectedProcedure } from "../orpc.js";
import { Asset } from "../models/Asset.js";

const assetSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    category: z.string().min(1),
    location: z.string().min(1),
    quantity: z.number().min(0).default(1),
    minQuantity: z.number().min(0).default(5),
    status: z.enum(["available", "in-use", "maintenance", "retired"]).default("available"),
    assignedTo: z.string().nullable().optional(),
    purchasedDate: z.string().datetime().nullable().optional(),
    warrantyExpiry: z.string().datetime().nullable().optional(),
});

export const assetsRouter = {
    list: protectedProcedure
        .input(
            z.object({
                category: z.string().optional(),
                status: z.enum(["available", "in-use", "maintenance", "retired"]).optional(),
                search: z.string().optional(),
            }).optional()
        )
        .handler(async ({ input }) => {
            const query: Record<string, unknown> = {};

            if (input?.category) query["category"] = input.category;
            if (input?.status) query["status"] = input.status;
            if (input?.search) {
                query["$or"] = [
                    { name: { $regex: input.search, $options: "i" } },
                    { description: { $regex: input.search, $options: "i" } },
                    { location: { $regex: input.search, $options: "i" } },
                ];
            }

            const assets = await Asset.find(query)
                .populate("assignedTo", "name email avatar")
                .populate("createdBy", "name email")
                .sort({ name: 1 });

            return assets.map((asset) => ({
                id: asset._id.toString(),
                name: asset.name,
                description: asset.description,
                category: asset.category,
                location: asset.location,
                quantity: asset.quantity,
                minQuantity: asset.minQuantity,
                status: asset.status,
                assignedTo: asset.assignedTo,
                purchasedDate: asset.purchasedDate?.toISOString(),
                warrantyExpiry: asset.warrantyExpiry?.toISOString(),
                updatedAt: asset.updatedAt.toISOString(),
            }));
        }),

    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const asset = await Asset.findById(input.id)
                .populate("assignedTo", "name email avatar")
                .populate("createdBy", "name email");

            if (!asset) throw new Error("Asset not found");

            return {
                id: asset._id.toString(),
                name: asset.name,
                description: asset.description,
                category: asset.category,
                location: asset.location,
                quantity: asset.quantity,
                minQuantity: asset.minQuantity,
                status: asset.status,
                assignedTo: asset.assignedTo,
                purchasedDate: asset.purchasedDate?.toISOString(),
                warrantyExpiry: asset.warrantyExpiry?.toISOString(),
                updatedAt: asset.updatedAt.toISOString(),
            };
        }),

    create: protectedProcedure
        .input(assetSchema)
        .handler(async ({ input, context }) => {
            const newAsset = new Asset({
                name: input.name,
                description: input.description,
                category: input.category,
                location: input.location,
                quantity: input.quantity,
                minQuantity: input.minQuantity,
                status: input.status,
                assignedTo: input.assignedTo || undefined,
                purchasedDate: input.purchasedDate ? new Date(input.purchasedDate) : undefined,
                warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
                createdBy: context.user.userId,
            });

            const asset = await newAsset.save();

            return {
                id: asset._id.toString(),
                name: asset.name,
            };
        }),

    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: assetSchema.partial(),
            })
        )
        .handler(async ({ input }) => {
            const updateData: Record<string, unknown> = { ...input.data };
            if (input.data.purchasedDate !== undefined) {
                updateData["purchasedDate"] = input.data.purchasedDate ? new Date(input.data.purchasedDate) : null;
            }
            if (input.data.warrantyExpiry !== undefined) {
                updateData["warrantyExpiry"] = input.data.warrantyExpiry ? new Date(input.data.warrantyExpiry) : null;
            }

            const asset = await Asset.findByIdAndUpdate(input.id, { $set: updateData }, { new: true });
            if (!asset) throw new Error("Asset not found");

            return {
                id: asset._id.toString(),
                name: asset.name,
            };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .handler(async ({ input }) => {
            const asset = await Asset.findByIdAndDelete(input.id);
            if (!asset) throw new Error("Asset not found");
            return { success: true };
        }),

    getLowStock: protectedProcedure
        .handler(async () => {
            // Find assets where quantity is less than or equal to minQuantity
            const assets = await Asset.find({ $expr: { $lte: ["$quantity", "$minQuantity"] } })
                .populate("assignedTo", "name email avatar")
                .sort({ quantity: 1 });

            return assets.map((asset) => ({
                id: asset._id.toString(),
                name: asset.name,
                quantity: asset.quantity,
                minQuantity: asset.minQuantity,
                status: asset.status,
                category: asset.category,
                location: asset.location,
            }));
        }),
};
