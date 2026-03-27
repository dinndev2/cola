import { useState, useMemo, useRef } from "react";
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import ChatRoom from "./ChatRoom";
import { useChatSocket } from "./shared/setupsocket";
import { CanvasContainer } from "./CanvasContainer";
import { capitalize, generateId } from "./shared/helper";
import Tools from "./Tools";

export default function Room() {
  const [room, setRoom] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [brushSize, setBrushSize] = useState(10)
  const [currentColor, setCurrentColor] = useState("")
  const [canvasKey, setCanvasKey] = useState(0)
  const socket = useChatSocket({ url: "http://localhost:3000", roomId: room });
  const canvasRef = useRef<HTMLCanvasElement>(null);



  const randomName = useMemo(() => {
    const name = uniqueNamesGenerator({ 
      dictionaries: [adjectives, colors, animals],
      separator: ' ',
      length: 3 
    });
    return name.split(' ').map(capitalize).join(' ');
  }, []);

  const copyToClipboard = async () => {
    if (!roomInput) return;
    await navigator.clipboard.writeText(roomInput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (room === "") {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b0f1a] p-4">
        <div className="bg-[#111827] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-800/50 animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
             <h1 className="text-2xl font-black text-white tracking-tight leading-tight">Welcome, {randomName}</h1>
             <p className="text-slate-500 text-sm mt-2 font-medium uppercase tracking-widest">Connect to a Workspace</p>
          </div>
          
          <form onSubmit={(e) => { e.preventDefault(); setRoom(roomInput); }} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between px-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Room ID</span>
                <button type="button" onClick={() => setRoomInput(generateId())} className="text-blue-500 hover:underline">Generate</button>
              </div>
              <div className="relative group">
                <input
                  type="text"
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                  placeholder="XXXXXXX"
                  className="w-full px-5 py-4 bg-[#1f2937] border border-slate-700 rounded-2xl outline-none text-white font-mono text-lg tracking-[0.3em] focus:border-blue-500 transition-all"
                />
                {roomInput && (
                  <button type="button" onClick={copyToClipboard} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${copied ? 'bg-green-500' : 'bg-slate-700 hover:bg-slate-600'} text-white`}>
                    {copied ? <span className="text-xs">✓</span> : <span className="text-xs text-slate-400">❐</span>}
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button type="submit" disabled={!roomInput} className="py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95">Join</button>
              <button type="button" onClick={() => setRoom(generateId())} className="py-4 bg-[#1f2937] border border-slate-700 text-slate-300 font-bold rounded-2xl hover:bg-slate-800 transition-all">Quick Match</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#0b0f1a] overflow-hidden relative font-sans">
      <main className={`flex-1 flex flex-col items-center justify-center p-12 relative bg-[#111827] transition-all duration-500 ${!isSidebarOpen ? 'w-full' : 'hidden md:flex'}`}>
        
        {/* FLOAT TOGGLE BUTTON */}
        {!isSidebarOpen && (
          <button 
            onClick={() => { setIsSidebarOpen(true); setHasNewMessage(false); }}
            className="absolute top-10 right-10 flex items-center gap-3 px-6 py-4 bg-[#1f2937] text-white rounded-[1.5rem] border border-slate-700 hover:border-blue-500/50 transition-all shadow-2xl group"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 group-hover:rotate-12 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              {hasNewMessage && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
            </div>
            <span className="text-xs font-black uppercase tracking-widest">Open Chat</span>
          </button>
        )}

        <CanvasContainer setCanvasKey={setCanvasKey} canvasRef={canvasRef} roomId={room} socket={socket} key={canvasKey}currentColor={currentColor} brushSize={brushSize} />
        <Tools roomId={room} socket={socket} setCanvasKey={setCanvasKey} currentColor={currentColor} setCurrentColor={setCurrentColor} brushSize={brushSize} setBrushSize={setBrushSize} />
        
        <button onClick={() => setRoom("")} className="absolute top-10 left-10 text-[10px] font-black text-slate-600 hover:text-rose-500 transition-colors uppercase tracking-[0.3em]">← Exit</button>
      </main>

      {/* CHAT SIDEBAR */}
      {isSidebarOpen && (
        <aside className="w-full md:w-[420px] border-l border-slate-800 bg-[#0b0f1a] shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center px-6 py-5 bg-[#111827] border-b border-slate-800">
             <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Connected</span>
             </div>
             <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors text-2xl font-light">×</button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatRoom 
                roomId={room} 
                socket={socket}
                randomName={randomName} 
                onNewMessage={() => !isSidebarOpen && setHasNewMessage(true)} 
            />
          </div>
        </aside>
      )}
    </div>
  );
}