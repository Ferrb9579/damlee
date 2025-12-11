import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IEvent extends Document {
    title: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    createdBy: Types.ObjectId;
    attendees: Types.ObjectId[];
    status: "scheduled" | "in-progress" | "completed" | "cancelled";
    color?: string;
    reminders: Date[];
    createdAt: Date;
    updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        start: {
            type: Date,
            required: true,
        },
        end: {
            type: Date,
            required: true,
        },
        location: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        attendees: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        status: {
            type: String,
            enum: ["scheduled", "in-progress", "completed", "cancelled"],
            default: "scheduled",
        },
        color: {
            type: String,
            default: "#3b82f6",
        },
        reminders: [
            {
                type: Date,
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Index for efficient date range queries
eventSchema.index({ start: 1, end: 1 });
eventSchema.index({ createdBy: 1 });

export const Event: Model<IEvent> = mongoose.model<IEvent>("Event", eventSchema);
