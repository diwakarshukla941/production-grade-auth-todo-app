import express from "express";
import {
    createTodo,
    deleteTodo,
    getTodos,
    updateTodo,
} from "../controllers/todo.controller.js";
import { isAuthenticated } from "../middlewares/authenticated.middleware.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/", getTodos);
router.post("/", createTodo);
router.patch("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
