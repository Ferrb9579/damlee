import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface ITeam extends Document {
    name: string;
    description?: string;
    members: Types.ObjectId[];
    owner: Types.ObjectId;
    color?: string;
    createdAt: Date;
    updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
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
        members: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        color: {
            type: String,
            default: "#8b5cf6",
        },
    },
    {
        timestamps: true,
    }
);

teamSchema.index({ owner: 1 });
teamSchema.index({ members: 1 });

export const Team: Model<ITeam> = mongoose.model<ITeam>("Team", teamSchema);
