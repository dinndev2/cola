import { Server } from "socket.io";
import { createServer } from "http";
import express from "express"; // 1. Add Express
import path from "path";       // 2. Add Path
import dotenv from 'dotenv';

dotenv.config();

const app = express(); // 3. Initialize Express
const HTTPServer = createServer(app); // 4. Pass app to createServer

const isProduction = process.env.NODE_ENV === 'production';

// In production, the "origin" is the app's own URL
const originUrl = isProduction 
  ? 'https://cola.fly.dev/' // Change this to your actual Fly.io URL
  : 'http://localhost:5173';

export const io = new Server(HTTPServer, {
  cors: {
    origin: originUrl 
  },
});

// --- SERVING THE FRONTEND ---
const __dirname = path.resolve();

if (isProduction) {
  // 5. Tell Express where your Vite build folder is
  app.use(express.static(path.join(__dirname, "dist")));

  // 6. Handle React routing (Send index.html for any route)
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

// --- YOUR SOCKET LOGIC (Unchanged) ---
let roomMessages: any = {};
let roomDrawings: any = {}; 

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join", (roomId) => {
    socket.join(roomId);
    if (roomMessages[roomId]) socket.emit("room-history", roomMessages[roomId]);
    if (roomDrawings[roomId]) socket.emit("draw-history", roomDrawings[roomId]);
  });

  socket.on("draw-step", ({ roomId, config }) => {
    if (!roomDrawings[roomId]) roomDrawings[roomId] = [];
    roomDrawings[roomId].push({ ...config, type: 'draw' });
    socket.to(roomId).emit("draw-step", { config });
  });

  socket.on("stop-drawing", (roomId) => {
    if (!roomDrawings[roomId]) roomDrawings[roomId] = [];
    roomDrawings[roomId].push({ type: 'stop' });
    socket.to(roomId).emit("remote-stop-drawing");
  });

  socket.on("clear-canvas", (roomId) => {
    roomDrawings[roomId] = [];
    io.to(roomId).emit("clear-canvas");
  });

  socket.on("chat-message", ({ roomId, message }) => {
    const { content, name, profile } = message;
    if (!roomMessages[roomId]) roomMessages[roomId] = [];
    const fullMessage = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name, content, profile
    };
    roomMessages[roomId].push(fullMessage);
    io.to(roomId).emit("chat-message", { roomId, fullMessage });
  });
});

// 7. Listen on 0.0.0.0 for Fly.io
const PORT = process.env.PORT || 3000;
HTTPServer.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`Server running in ${isProduction ? 'prod' : 'dev'} on port ${PORT}`);
});