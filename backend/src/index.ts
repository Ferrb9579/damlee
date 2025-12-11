import "dotenv/config";
import express from "express";
import cors from "cors";
import { RPCHandler } from "@orpc/server/fetch";
import { router } from "./router/index.js";
import { connectDB } from "./db/connection.js";
import { createContext } from "./orpc.js";

const app = express();
const PORT = process.env["PORT"] ?? 3001;

// Middleware
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
}));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ORPC Handler
const handler = new RPCHandler(router);

app.all("/api/{*splat}", async (req, res) => {
    const context = createContext(req);

    // Convert Express request to Fetch Request
    const url = new URL(req.url, `http://${req.headers.host}`);
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
        if (value) {
            headers.set(key, Array.isArray(value) ? value.join(", ") : value);
        }
    }

    const requestInit: RequestInit = {
        method: req.method,
        headers,
    };

    if (!["GET", "HEAD"].includes(req.method)) {
        requestInit.body = JSON.stringify(req.body);
    }

    const fetchRequest = new Request(url, requestInit);

    try {
        const { matched, response } = await handler.handle(fetchRequest, {
            prefix: "/api",
            context,
        });

        if (!matched) {
            res.status(404).json({ error: "Not found" });
            return;
        }

        // Set response headers
        response.headers.forEach((value, key) => {
            res.setHeader(key, value);
        });

        res.status(response.status);
        const body = await response.text();
        res.send(body);
    } catch (error) {
        console.error("ORPC Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Start server
async function start() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📚 API available at http://localhost:${PORT}/api`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

start();
