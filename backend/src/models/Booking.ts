import { Schema, model, Document, Types } from "mongoose";

export interface IBooking extends Document {
    title: string;
    description?: string;
    room: Types.ObjectId;
    organizer: Types.ObjectId;
    attendees: Types.ObjectId[];
    startTime: Date;
    endTime: Date;
    status: "pending" | "confirmed" | "cancelled" | "rejected";
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        title: { type: String, required: true },
        description: { type: String },
        room: { type: Schema.Types.ObjectId, ref: "Room", required: true, index: true },
        organizer: { type: Schema.Types.ObjectId, ref: "User", required: true },
        attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
        startTime: { type: Date, required: true, index: true },
        endTime: { type: Date, required: true, index: true },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "rejected"],
            default: "confirmed", // Auto-confirm for now unless we add approval workflow
            index: true,
        },
    },
    { timestamps: true }
);

// Index to help with overlap queries
bookingSchema.index({ room: 1, startTime: 1, endTime: 1 });

export const Booking = model<IBooking>("Booking", bookingSchema);
