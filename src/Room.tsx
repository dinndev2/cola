import { useState, useMemo, useRef, useEffect } from "react";
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import ChatRoom from "./ChatRoom";
import { useChatSocket } from "./shared/setupsocket";
import { CanvasContainer } from "./CanvasContainer";
import { capitalize, generateId } from "./shared/helper";
import Tools from "./Tools";
import dotenv from 'dotenv'

export default function Room() {
  const [step, setStep] = useState(1);
  const [room, setRoom] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [userName, setUserName] = useState("");
  const [userColor, setUserColor] = useState("#3b82f6"); 
  const avatarColors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#a855f7", "#ec4899", "#f97316"];
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [brushSize, setBrushSize] = useState(10);
  const [currentColor, setCurrentColor] = useState("");
  const [canvasKey, setCanvasKey] = useState(0);
  const [isEraser, setIsEraser] = useState(false);
  const [isText, setIsText] = useState(false);
  const [err, setErr] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const isProduction = process.env.NODE_ENV === "production";
  const socketConnection = isProduction ? "https://cola.fly.dev" : "http://localhost:3000";

  const socket = useChatSocket({ 
    url: socketConnection, 
    roomId: room,
    userName,    
    userColor,
    setErr  
  });

  const suggestion = useMemo(() => {
    const name = uniqueNamesGenerator({ 
      dictionaries: [adjectives, colors, animals],
      separator: ' ',
      length: 3 
    });
    return name.split(' ').map(capitalize).join(' ');
  }, []);

  useEffect(() => {
    if (!userName) setUserName(suggestion);
  }, [suggestion, userName]);

  const handleStartSession = () => {
    setRoom(roomInput);
    if (!currentColor) setCurrentColor(userColor); 
    setStep(3);
  };

  if (step === 1) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b0f1a] p-4">
        <div className="bg-[#111827] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-800/50">
          <div className="text-center mb-8">
             <h1 className="text-2xl font-black text-white tracking-tight">Collaborative Canvas</h1>
             <p className="text-slate-500 text-[10px] mt-2 font-black uppercase tracking-[0.2em]">Enter a Room ID to begin</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between px-1 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <span>Room ID</span>
                <button type="button" onClick={() => setRoomInput(generateId())} className="text-blue-500 hover:underline">Generate</button>
              </div>
              <input
                type="text"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                placeholder="XXXXXXX"
                className="w-full px-5 py-4 bg-[#1f2937] border border-slate-700 rounded-2xl outline-none text-white font-mono text-lg tracking-[0.3em] focus:border-blue-500 transition-all"
              />
            </div>
            <button type="submit" disabled={!roomInput} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95">
              Continue →
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0b0f1a] p-4">
        <div className="bg-[#111827] p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-800/50">
          <button onClick={() => setStep(1)} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest mb-8 transition-colors">← Back</button>
          <div className="text-center mb-10">
             <div 
               className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl font-black text-white shadow-2xl transition-all duration-500"
               style={{ backgroundColor: userColor, boxShadow: `0 20px 50px -10px ${userColor}66` }}
             >
               {userName.charAt(0).toUpperCase()}
             </div>
             <h1 className="text-2xl font-black text-white tracking-tight">Set your Profile</h1>
          </div>
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Display Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-5 py-3.5 bg-[#1f2937] border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-all font-semibold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Identity Color</label>
              <div className="flex justify-between items-center bg-[#1f2937] p-4 rounded-2xl border border-slate-700/30">
                {avatarColors.map(color => (
                  <button 
                    key={color} 
                    onClick={() => setUserColor(color)}
                    className={`w-7 h-7 rounded-lg transition-all ${userColor === color ? 'ring-2 ring-white ring-offset-4 ring-offset-[#111827] scale-110' : 'opacity-30'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button onClick={handleStartSession} className="w-full py-5 bg-white text-[#0b0f1a] font-black rounded-2xl hover:bg-blue-50 transition-all shadow-2xl">
              LAUNCH CANVAS
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#0b0f1a] overflow-hidden relative font-sans">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-12 relative bg-[#111827] transition-all duration-500 min-w-0">
        {!isSidebarOpen && (
          <button 
            onClick={() => { setIsSidebarOpen(true); setHasNewMessage(false); }}
            className="absolute top-10 right-10 flex items-center gap-3 px-6 py-4 bg-[#1f2937]/90 backdrop-blur-xl text-white rounded-[1.5rem] border border-slate-700 hover:border-blue-500/50 transition-all shadow-2xl z-30"
          >
            <div className="relative">
               <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              {hasNewMessage && <span className="absolute -top-1 -right-1 flex h-3 w-3 rounded-full bg-blue-500 animate-pulse" />}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Open Chat</span>
          </button>
        )}
        <CanvasContainer
          err={err}
          setIsText={setIsText} isText={isText} isEraser={isEraser} 
          setCanvasKey={setCanvasKey} canvasRef={canvasRef} roomId={room} 
          socket={socket} key={canvasKey} currentColor={currentColor} brushSize={brushSize} 
        />
        
        {/* MOBILE OPTIMIZATION: Only show tools if sidebar is closed OR on Desktop */}
        <div className={`${isSidebarOpen ? "hidden md:block" : "block"}`}>
          <Tools 
            isText={isText} setIsText={setIsText} isEraser={isEraser} setIsEraser={setIsEraser} 
            roomId={room} socket={socket} setCanvasKey={setCanvasKey} currentColor={currentColor} 
            setCurrentColor={setCurrentColor} brushSize={brushSize} setBrushSize={setBrushSize} 
          />
        </div>
        
        <button onClick={() => { setRoom(""); setStep(1); }} className="absolute top-10 left-10 text-[10px] font-black text-slate-600 hover:text-rose-500 uppercase tracking-[0.3em] transition-colors">
          ← Exit Workspace
        </button>
      </main>

      <aside className={`
        fixed inset-y-0 right-0 z-50 w-full md:w-[420px] md:relative 
        flex-shrink-0 flex flex-col 
        border-l border-slate-800 bg-[#0b0f1a] transition-all duration-300 transform
        ${isSidebarOpen ? "translate-x-0" : "translate-x-full md:hidden"}
      `}>
        <div className="flex justify-between items-center px-6 py-5 bg-[#111827] border-b border-slate-800 shrink-0">
           <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Room: {room}</span>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="text-slate-500 hover:text-white transition-colors text-2xl font-light">×</button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <ChatRoom 
              userColor={userColor}
              roomId={room} 
              socket={socket}
              randomName={userName} 
              onNewMessage={() => { if (!isSidebarOpen) setHasNewMessage(true); }} 
          />
        </div>
      </aside>
    </div>
  );
}