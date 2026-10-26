
import express from "express";
import { createServer } from "node:http";
import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import cors from "cors";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

connectToSocket(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistPath = path.resolve(
    __dirname,
    "../../frontend/dist"
);

app.set("port", process.env.PORT || 8000);

app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// API routes
app.use("/api/v1/users", userRoutes);

app.get("/home", (req, res) => {
    res.send("Hello World");
});

// Serve the built React frontend
app.use(express.static(frontendDistPath));

// Send React's index.html for frontend routes
app.get("/{*splat}", (req, res) => {
    res.sendFile(path.join(frontendDistPath, "index.html"));
});

const start = async () => {
    try {
        const connectionDb = await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            `MongoDB connected: ${connectionDb.connection.host}`
        );

        server.listen(app.get("port"), () => {
            console.log(
                `Server running on port ${app.get("port")}`
            );
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

start();
