import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface ITask extends Document {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee?: Types.ObjectId;
    createdBy: Types.ObjectId;
    dueDate?: Date;
    team?: Types.ObjectId;
    labels: string[];
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
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
        status: {
            type: String,
            enum: ["todo", "in-progress", "review", "done"],
            default: "todo",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high", "urgent"],
            default: "medium",
        },
        assignee: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        dueDate: {
            type: Date,
        },
        team: {
            type: Schema.Types.ObjectId,
            ref: "Team",
        },
        labels: [
            {
                type: String,
                trim: true,
            },
        ],
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for common queries
taskSchema.index({ status: 1, order: 1 });
taskSchema.index({ assignee: 1 });
taskSchema.index({ team: 1 });
taskSchema.index({ createdBy: 1 });

export const Task: Model<ITask> = mongoose.model<ITask>("Task", taskSchema);
