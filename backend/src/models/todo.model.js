import mongoose from "mongoose";

const todoSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            default: "",
            trim: true,
            maxlength: 1200,
        },
        status: {
            type: String,
            enum: ["pending", "in_progress", "completed"],
            default: "pending",
        },
        priority: {
            type: String,
            enum: ["low", "medium", "high"],
            default: "medium",
        },
        dueDate: {
            type: Date,
            default: null,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

todoSchema.index({ userId: 1, createdAt: -1 });
todoSchema.index({ userId: 1, status: 1, priority: 1 });

export const Todo = mongoose.model("Todo", todoSchema);
