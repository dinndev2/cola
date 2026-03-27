import { Server } from "socket.io";
import { createServer } from "http";
const HTTPServer = createServer();
import dotenv from 'dotenv';

dotenv.config(); // Loads variables from your .env file

const isProduction = process.env.NODE_ENV === 'production';

const originUrl = isProduction 
  ? 'https://your-frontend-app.vercel.app' 
  : 'http://localhost:5173'; // Vite default port

export const io = new Server(HTTPServer, {
  cors: {
    origin: originUrl 
  },
});

// In-memory data stores
let roomMessages = {};
let roomDrawings = {}; 

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // --- JOIN LOGIC ---
  socket.on("join", (roomId) => {
    socket.join(roomId);
    
    // Send chat history
    if (roomMessages[roomId]) {
      socket.emit("room-history", roomMessages[roomId]);
    }
    
    // Send drawing history so the late-comer sees the full picture
    if (roomDrawings[roomId]) {
      socket.emit("draw-history", roomDrawings[roomId]);
    }
  });

  // --- DRAWING LOGIC ---
  socket.on("draw-step", ({ roomId, config }) => {
    if (!roomDrawings[roomId]) roomDrawings[roomId] = [];
    
    // 1. Save step to history with a 'draw' type
    const drawData = { ...config, type: 'draw' };
    roomDrawings[roomId].push(drawData);

    // 2. Broadcast to everyone ELSE in the room
    socket.to(roomId).emit("draw-step", { config });
  });

  // Handle the end of a stroke (MouseUp / MouseLeave)
  socket.on("stop-drawing", (roomId) => {
    if (!roomDrawings[roomId]) roomDrawings[roomId] = [];
    
    // 1. Save a 'stop' marker so history knows where a line ends
    roomDrawings[roomId].push({ type: 'stop' });

    // 2. Tell other clients to reset their paths
    socket.to(roomId).emit("remote-stop-drawing");
  });

  // Handle clearing the board
  socket.on("clear-canvas", (roomId) => {
    roomDrawings[roomId] = []; // Reset history
    io.to(roomId).emit("clear-canvas"); // Tell everyone to wipe screens
  });

  // --- CHAT LOGIC ---
  socket.on("chat-message", ({ roomId, message }) => {
    const { content, name, profile } = message;
    if (!roomMessages[roomId]) roomMessages[roomId] = [];

    const fullMessage = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      name,
      content,
      profile
    };

    roomMessages[roomId].push(fullMessage);
    
    // Send to everyone in the room
    io.to(roomId).emit("chat-message", { roomId, fullMessage });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000
HTTPServer.listen(PORT , () => {
  console.log(`Server running on port ${PORT}`);
});