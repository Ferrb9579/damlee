import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type AssetStatus = "available" | "in-use" | "maintenance" | "retired";

export interface IAsset extends Document {
    name: string;
    description?: string;
    category: string;
    location: string;
    quantity: number;
    minQuantity: number;
    status: AssetStatus;
    assignedTo?: Types.ObjectId;
    purchasedDate?: Date;
    warrantyExpiry?: Date;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const assetSchema = new Schema<IAsset>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
            default: 1,
        },
        minQuantity: {
            type: Number,
            required: true,
            min: 0,
            default: 5,
        },
        status: {
            type: String,
            enum: ["available", "in-use", "maintenance", "retired"],
            default: "available",
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        purchasedDate: {
            type: Date,
        },
        warrantyExpiry: {
            type: Date,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
assetSchema.index({ category: 1 });
assetSchema.index({ status: 1 });
assetSchema.index({ location: 1 });
assetSchema.index({ createdBy: 1 });

export const Asset: Model<IAsset> = mongoose.model<IAsset>("Asset", assetSchema);
