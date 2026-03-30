import { useEffect, useState, useRef, type FormEvent } from "react";
import Profile from "./shared/Profile";
import { type Socket } from "socket.io-client";

type ChatProps = {
  roomId: string;
  randomName: string;
  socket: Socket | null;
  userColor: string
  onNewMessage?: () => void;
}

export default function ChatRoom({ randomName, roomId, onNewMessage, socket, userColor }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on("room-history", (roomHistory) => setMessages(roomHistory));
    const handleMsg = ({fullMessage}: any) => {
      setMessages(prev => [...prev, fullMessage]);
      if (onNewMessage) onNewMessage();
    }; 

    socket.on("chat-message", handleMsg);
    return () => { socket.off("chat-message", handleMsg); };
  }, [socket, onNewMessage]);

  const sendMsg = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    const message = { name: randomName, content: input, timestamp: Date.now(), id: Date.now().toString(), senderColor: userColor };
    socket?.emit("chat-message", { roomId, message });    
    setInput(""); 
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0b0f1a] text-slate-100 overflow-hidden">
      {/* MESSAGES VIEWPORT */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {messages.length === 0 ? (
          <div className="h-full min-h-[200px] flex items-center justify-center">
            <div className="text-center max-w-[320px]">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center shadow-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-blue-400">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-300">Start the conversation</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.name === randomName ? "items-end" : "items-start"}`}>
                <Profile userColor={userColor} currentName={randomName} senderColor={m.senderColor} name={m.name} />
                <div className={`mt-2 px-4 py-3 rounded-[1.2rem] max-w-[85%] text-[15px] leading-relaxed shadow-xl border ${
                    m.name === randomName
                      ? "bg-blue-600 text-white border-blue-400/20 rounded-tr-none"
                      : "bg-slate-900/60 text-slate-200 border-slate-700/50 rounded-tl-none"
                  }`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* INPUT AREA: Fixed at bottom with Safe Area support */}
      <div className="shrink-0 p-4 bg-[#0b0f1a]/95 backdrop-blur-xl border-t border-slate-800/60 mb-2 md:mb-0">
        <form onSubmit={sendMsg} className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message room..."
            className="flex-1 px-5 py-4 bg-[#1f2937] border border-slate-700/70 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925c.058.2.222.35.425.388l4.56.847a.25.25 0 0 1 0 .491l-4.56.847a.425.425 0 0 0-.425.388l-1.414 4.925a.75.75 0 0 0 .826.95 44.896 44.896 0 0 0 14.174-7.653.75.75 0 0 0 0-1.2l-14.174-7.653Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}