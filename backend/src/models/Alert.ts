import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type AlertType = "info" | "warning" | "error" | "success";
export type AlertSource = "manual" | "iot" | "system";
export type AlertPriority = "low" | "medium" | "high" | "critical";

export interface IAlert extends Document {
    title: string;
    message: string;
    type: AlertType;
    source: AlertSource;
    targetUsers: Types.ObjectId[];
    readBy: Types.ObjectId[];
    priority: AlertPriority;
    metadata?: Record<string, unknown>;
    expiresAt?: Date;
    createdAt: Date;
}

const alertSchema = new Schema<IAlert>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ["info", "warning", "error", "success"],
            default: "info",
        },
        source: {
            type: String,
            enum: ["manual", "iot", "system"],
            default: "manual",
        },
        targetUsers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        readBy: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
        },
        metadata: {
            type: Schema.Types.Mixed,
        },
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Indexes
alertSchema.index({ targetUsers: 1 });
alertSchema.index({ createdAt: -1 });
alertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Alert: Model<IAlert> = mongoose.model<IAlert>("Alert", alertSchema);
