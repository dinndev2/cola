import { useState, useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";

interface UseSocketOptions {
  url: string;
  roomId: string;
  userName: string;
  userColor: string;
  setErr: React.Dispatch<React.SetStateAction<string>>
}

export function useChatSocket({ url, roomId, userName, userColor, setErr }: UseSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. Only connect if we have a Room ID. 
    // We can be more flexible with userName by using a fallback if needed.
    if (!url || !roomId) return;

    // Prevent multiple connections if the effect re-runs
    if (socketRef.current?.connected) return;

    const s = io(url, {
      transports: ["websocket"]
    });

    s.on("connect", () => {
      console.log("✅ Socket Connected:", s.id);
      // Use the latest values when emitting join
      s.emit("join", roomId, userName || "Anonymous", userColor || "#3b82f6");
    });

    s.on("connect_error", (err) => {
      setErr(`${err.message} ${err.name} ${err.cause} ${err.stack}`)
      console.error("❌ Socket Connection Error:", err.message);
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      if (s) {
        console.log("Cleaning up socket...");
        s.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
    // We only want to reconnect if the URL or RoomID changes.
    // Changing the name/color shouldn't necessarily drop the whole connection.
  }, [url, roomId]); 

  // 2. Separate Effect to update identity without reconnecting
  useEffect(() => {
    if (socket && socket.connected && userName) {
      socket.emit("update-identity", { userName, userColor });
    }
  }, [userName, userColor, socket]);

  return socket;
}