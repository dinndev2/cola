import express from "express";
import type { Request, Response } from "express"; // Use 'import type' for TS types
import { createServer } from "http";
import path from "path";
import dotenv from "dotenv";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const HTTPServer = createServer(app);

const isProduction = process.env.NODE_ENV === "production";
export const originUrl = isProduction ? "https://cola.fly.dev" : "http://localhost:5173";
// ---------------- Socket.IO ----------------
export const io = new Server(HTTPServer, {
  cors: { 
    origin: [originUrl, "http://localhost:5173", "http://127.0.0.1:5173"], 
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  pingTimeout: 60000, // Increase for mobile stability
  pingInterval: 25000
});

let roomMessages: Record<string, any[]> = {};
let roomDrawings: Record<string, any[]> = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", (roomId: string) => {
    socket.join(roomId);
    if (roomMessages[roomId]) socket.emit("room-history", roomMessages[roomId]);
    if (roomDrawings[roomId]) socket.emit("draw-history", roomDrawings[roomId]);
  });

  socket.on("draw-step", ({ roomId, config }) => {
    roomDrawings[roomId] ??= [];
    roomDrawings[roomId].push({ ...config, type: "draw" });
    socket.to(roomId).emit("draw-step", { config });
  });

  socket.on("stop-drawing", (roomId: string) => {
    roomDrawings[roomId] ??= [];
    roomDrawings[roomId].push({ type: "stop" });
    socket.to(roomId).emit("remote-stop-drawing");
  });

  socket.on("write", ({roomId, text, x, y, currentColor}) => {
    const config = {text, x, y, currentColor}
    roomDrawings[roomId] ??= [];
    roomDrawings[roomId].push({ ...config, type: "draw" });
    socket.to(roomId).emit("write", config)
  })

  socket.on("clear-canvas", (roomId: string) => {
    roomDrawings[roomId] = [];
    io.to(roomId).emit("clear-canvas");
  });

  socket.on("chat-message", ({ roomId, message }) => {
    const { content, name, profile } = message;
    roomMessages[roomId] ??= [];
    const fullMessage = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name,
      content,
      profile,
    };
    roomMessages[roomId].push(fullMessage);
    io.to(roomId).emit("chat-message", { roomId, fullMessage });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// ---------------- Serve Frontend ----------------
const __dirname = path.resolve();
if (isProduction) {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*all", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
} else {
  app.get("/", (req: Request, res: Response) => {
    res.send("Server running in development mode");
  });
}

// ---------------- Start Server ----------------
const PORT = Number(process.env.PORT || 3000);
HTTPServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running in ${isProduction ? "production" : "development"} on port ${PORT}`);
});