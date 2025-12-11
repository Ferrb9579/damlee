import { Schema, model, Document } from "mongoose";

export interface IRoom extends Document {
    name: string;
    capacity: number;
    location: string;
    amenities: string[];
    status: "available" | "maintenance" | "occupied";
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
    {
        name: { type: String, required: true },
        capacity: { type: Number, required: true },
        location: { type: String, required: true },
        amenities: [{ type: String }],
        status: {
            type: String,
            enum: ["available", "maintenance", "occupied"],
            default: "available",
            index: true,
        },
        images: [{ type: String }],
    },
    { timestamps: true }
);

export const Room = model<IRoom>("Room", roomSchema);
