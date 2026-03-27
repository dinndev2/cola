import { useState, useEffect } from "react";
import { io, type Socket } from "socket.io-client";

interface UseSocketOptions {
  url: string;
  roomId: string;
}

/**
 * Single socket per mount; state updates when the client is created so
 * effects that depend on `socket` run and can subscribe to events.
 */
export function useChatSocket({ url, roomId }: UseSocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(url);

    s.on("connect", () => {
      s.emit("join", roomId, name);
    });

    // Same tick as creation — triggers a re-render so listeners attach immediately
    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [url, roomId]);

  return socket;
}
