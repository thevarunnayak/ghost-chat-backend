import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import { handleWebSocket } from "./ws/handler.js";
import roomRoutes from "./routes/room.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ✅ register routes AFTER app is created
app.use("/api/rooms", roomRoutes);

const server = http.createServer(app);

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  handleWebSocket(ws);
});

export { app, server };