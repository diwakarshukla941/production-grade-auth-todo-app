import mongoose from "mongoose";
import { Todo } from "../models/todo.model.js";

const TODO_STATUSES = ["pending", "in_progress", "completed"];
const TODO_PRIORITIES = ["low", "medium", "high"];

const sanitizeText = (value = "") => value.trim();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseOptionalDate = (value) => {
    if (value === undefined) {
        return undefined;
    }

    if (value === null || value === "") {
        return null;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Invalid due date");
    }

    return parsedDate;
};

const applyTodoFields = (todo, payload) => {
    if (payload.title !== undefined) {
        const title = sanitizeText(payload.title);

        if (!title) {
            throw new Error("Title is required");
        }

        if (title.length > 120) {
            throw new Error("Title must be 120 characters or fewer");
        }

        todo.title = title;
    }

    if (payload.description !== undefined) {
        const description = sanitizeText(payload.description ?? "");

        if (description.length > 1200) {
            throw new Error("Description must be 1200 characters or fewer");
        }

        todo.description = description;
    }

    if (payload.status !== undefined) {
        if (!TODO_STATUSES.includes(payload.status)) {
            throw new Error("Invalid status value");
        }

        todo.status = payload.status;
        todo.completedAt = payload.status === "completed" ? todo.completedAt ?? new Date() : null;
    }

    if (payload.priority !== undefined) {
        if (!TODO_PRIORITIES.includes(payload.priority)) {
            throw new Error("Invalid priority value");
        }

        todo.priority = payload.priority;
    }

    const dueDate = parseOptionalDate(payload.dueDate);

    if (dueDate !== undefined) {
        todo.dueDate = dueDate;
    }
};

export const getTodos = async (req, res) => {
    try {
        const { status = "all", priority = "all", search = "" } = req.query;
        const query = { userId: req.userId };

        if (status !== "all") {
            if (!TODO_STATUSES.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid status filter",
                });
            }

            query.status = status;
        }

        if (priority !== "all") {
            if (!TODO_PRIORITIES.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid priority filter",
                });
            }

            query.priority = priority;
        }

        const normalizedSearch = sanitizeText(search);

        if (normalizedSearch) {
            const searchRegex = new RegExp(escapeRegExp(normalizedSearch), "i");
            query.$or = [
                { title: searchRegex },
                { description: searchRegex },
            ];
        }

        const todos = await Todo.find(query).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: todos,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const createTodo = async (req, res) => {
    try {
        const todo = new Todo({
            userId: req.userId,
        });

        applyTodoFields(todo, req.body);

        if (!todo.title) {
            return res.status(400).json({
                success: false,
                message: "Title is required",
            });
        }

        await todo.save();

        return res.status(201).json({
            success: true,
            message: "Todo created successfully",
            data: todo,
        });
    } catch (error) {
        const statusCode = error.message.startsWith("Invalid") || error.message.includes("required") ? 400 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const updateTodo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid todo id",
            });
        }

        const todo = await Todo.findOne({ _id: id, userId: req.userId });

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "Todo not found",
            });
        }

        const updatableFields = ["title", "description", "status", "priority", "dueDate"];
        const hasUpdates = updatableFields.some((field) => Object.prototype.hasOwnProperty.call(req.body, field));

        if (!hasUpdates) {
            return res.status(400).json({
                success: false,
                message: "No todo fields provided for update",
            });
        }

        applyTodoFields(todo, req.body);
        await todo.save();

        return res.status(200).json({
            success: true,
            message: "Todo updated successfully",
            data: todo,
        });
    } catch (error) {
        const statusCode = error.message.startsWith("Invalid") || error.message.includes("required") ? 400 : 500;

        return res.status(statusCode).json({
            success: false,
            message: error.message,
        });
    }
};

export const deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid todo id",
            });
        }

        const todo = await Todo.findOneAndDelete({ _id: id, userId: req.userId });

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "Todo not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Todo deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
