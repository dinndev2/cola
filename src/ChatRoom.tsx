import { useEffect, useState, useRef, type FormEvent } from "react";
import Profile, { randomizedProfile } from "./shared/Profile";
import { type Socket } from "socket.io-client";

type ChatProps = {
  roomId: string;
  randomName: string;
  socket: Socket | null;
  onNewMessage?: () => void; // Prop to notify the parent
}

export default function ChatRoom({ randomName, roomId, onNewMessage, socket }: ChatProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [currentProfile, setCurrentProfile] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    setCurrentProfile(randomizedProfile());
    
    socket.on("room-history", (roomHistory) => setMessages(roomHistory));
    const handleMsg = ({fullMessage}: any) => {
      setMessages(prev => [...prev, fullMessage]);
      if (onNewMessage) onNewMessage(); // Notify parent of new message
    }; 

    socket.on("chat-message", handleMsg);
    return () => { socket.off("chat-message", handleMsg); };
  }, [socket, onNewMessage]);

  const sendMsg = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    const message = { name: randomName, content: input, profile: currentProfile, timestamp: Date.now(), id: Date.now().toString() };
    socket?.emit("chat-message", { roomId, message });    
    setInput(""); 
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-[#0b0f1a] text-slate-100 overflow-hidden">
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
              <p className="mt-1 text-xs text-slate-500">Your messages will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {messages.map((m) => (
              <div key={m.id} className={`flex flex-col ${m.name === randomName ? "items-end" : "items-start"}`}>
                <Profile currentName={randomName} profile={m.profile} name={m.name} />
                <div
                  className={`mt-2 px-4 py-3 rounded-[1.2rem] max-w-[85%] text-[15px] leading-relaxed shadow-[0_18px_45px_rgba(0,0,0,0.45)] border ${
                    m.name === randomName
                      ? "bg-blue-600/95 text-white border-blue-400/20 rounded-tr-none"
                      : "bg-slate-900/60 text-slate-200 border-slate-700/50 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="sticky bottom-0 px-4 py-4 bg-[#0b0f1a]/70 backdrop-blur border-t border-slate-800/60">
        <form onSubmit={sendMsg} className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message room..."
            className="flex-1 px-5 py-4 bg-[#1f2937] border border-slate-700/70 rounded-2xl focus:ring-2 focus:ring-blue-500/50 outline-none text-white text-sm placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.925c.058.2.222.35.425.388l4.56.847a.25.25 0 0 1 0 .491l-4.56.847a.425.425 0 0 0-.425.388l-1.414 4.925a.75.75 0 0 0 .826.95 44.896 44.896 0 0 0 14.174-7.653.75.75 0 0 0 0-1.2l-14.174-7.653Z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}