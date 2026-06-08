import express from "express";
import connectDB from "./src/database/db.js";
import userRoute from "./src/routes/user.routes.js";
import todoRoute from "./src/routes/todo.routes.js";
import cors from "cors";
import "dotenv/config";

const app = express();

// Database Connection
connectDB();

// Middleware
app.use(express.json());

app.use(
    cors({
        origin: [
            "http://localhost:5173",
            process.env.CLIENT_URL,
        ],
        credentials: true,
    })
);

// Health Check Route
app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Server is running",
    });
});

// Routes
app.use("/api/auth", userRoute);
app.use("/api/todos", todoRoute);

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});