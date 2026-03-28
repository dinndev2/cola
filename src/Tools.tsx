import { Popover, Transition } from '@headlessui/react' 
import { Brush, Palette, Trash2, Eraser, CaseSensitive } from 'lucide-react' 
import { type Socket } from 'socket.io-client'
import React from 'react'

interface ToolsType {
  setBrushSize: React.Dispatch<React.SetStateAction<number>>
  setIsEraser: React.Dispatch<React.SetStateAction<boolean>>
  setCurrentColor: React.Dispatch<React.SetStateAction<string>>
  setCanvasKey: React.Dispatch<React.SetStateAction<number>>
  setIsText: React.Dispatch<React.SetStateAction<boolean>>
  brushSize: number
  currentColor: string 
  socket: Socket | null
  roomId: string
  isEraser: boolean
  isText: boolean
}

const toolButtonClass = `
  p-3.5 rounded-2xl flex items-center justify-center 
  transition-all duration-300
  cursor-pointer relative group
  hover:bg-white/10 active:scale-95
`;

// Glass style for the shortcut badges
const badgeClass = `
  absolute -top-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 
  bg-white/20 backdrop-blur-md border border-white/30 
  rounded-md text-white/70 opacity-0 group-hover:opacity-100 transition-opacity
`;

export default function Tools({ 
  isText, setIsEraser, setIsText, isEraser, 
  setBrushSize, brushSize, setCurrentColor, 
  currentColor, setCanvasKey, socket, roomId 
}: ToolsType) {
  
  const quickColors = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#111827", "#f9fafb"]; 

  // Toggle Logic: If Text is ON, Eraser must be OFF, and vice versa.
  const handleText = () => {
    const nextState = !isText;
    setIsText(nextState);
    if (nextState) setIsEraser(false);
  }

  const handleEraser = () => {
    const nextState = !isEraser;
    setIsEraser(nextState);
    if (nextState) setIsText(false);
  }

  const resetCanvas = () => {
    if (confirm("Are you sure you want to clear the entire canvas?")) {
      socket?.emit("clear-canvas", roomId);
      // The actual reset happens via the socket listener in CanvasContainer
    }
  } 

  return (
    <div className="
      fixed bottom-8 left-1/2 -translate-x-1/2 
      bg-[#0b0f1a]/60 backdrop-blur-2xl 
      border border-white/10 
      p-3 px-6 rounded-[2.5rem] 
      flex items-center gap-3 
      shadow-[0_25px_80px_-15px_rgba(0,0,0,0.6)]
      z-50
    ">
      {/* TEXT TOOL */}
      <button 
        onClick={handleText} 
        className={`${toolButtonClass} ${isText ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50" : "text-white"}`}
      >
        <CaseSensitive className="w-6 h-6" strokeWidth={1.5} />
        <span className={badgeClass}>T</span>
      </button>

      {/* BRUSH SIZE */}
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className={`${toolButtonClass} ${!isText && !isEraser ? "bg-white/10 text-white" : "text-white/60"}`}>
              <Brush className="w-6 h-6" strokeWidth={1.5} />
              <span className={badgeClass}>B</span>
            </Popover.Button>

            <Transition
              as={React.Fragment}
              enter="transition duration-200 ease-out"
              enterFrom="transform scale-90 opacity-0 -translate-y-2"
              enterTo="transform scale-100 opacity-100 translate-y-0"
              leave="transition duration-150 ease-in"
              leaveFrom="transform scale-100 opacity-100 translate-y-0"
              leaveTo="transform scale-90 opacity-0 -translate-y-2"
            >
              <Popover.Panel className="absolute bottom-full mb-8 -left-20 z-10">
                <div className="bg-[#111827]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl w-64">
                   <div className="flex justify-between items-center mb-5">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brush Size</span>
                      <span className="text-lg font-mono text-white">{brushSize}px</span>
                   </div>
                   <input 
                    type="range" min="1" max="100" value={brushSize}
                    onChange={e => setBrushSize(parseInt(e.target.value))}
                    className="w-full h-1.5 rounded-full cursor-pointer bg-slate-800 accent-blue-500"
                   />
                </div>
                <div className="w-4 h-4 bg-[#111827]/90 border border-white/10 border-t-0 border-l-0 rotate-45 absolute bottom-[-8px] left-[92px]"></div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>

      <div className="w-px h-8 bg-white/10 mx-1" />

      {/* COLOR PICKER */}
      <Popover className="relative">
        <Popover.Button className={`${toolButtonClass}`}>
          <div className="relative">
             <Palette className="w-6 h-6 text-white" strokeWidth={1.5} />
             <div style={{ backgroundColor: currentColor }} className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0b0f1a] shadow-sm"></div>
          </div>
        </Popover.Button>

        <Transition
          as={React.Fragment}
          enter="transition duration-200 ease-out"
          enterFrom="transform scale-90 opacity-0 -translate-y-2"
          enterTo="transform scale-100 opacity-100 translate-y-0"
        >
          <Popover.Panel className="absolute bottom-full mb-8 -left-24 z-10">
            <div className="bg-[#111827]/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] shadow-2xl w-72">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 text-center">Color Palette</div>
               <div className="grid grid-cols-6 gap-2.5 mb-6">
                  {quickColors.map(color => (
                    <button 
                      key={color} 
                      onClick={() => { setCurrentColor(color); setIsEraser(false); }} 
                      style={{ backgroundColor: color }} 
                      className={`w-8 h-8 rounded-xl transition-transform hover:scale-110 ${currentColor === color ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-[#111827]' : ''}`}
                    />
                  ))}
               </div>
               <div className="flex gap-3 items-center bg-white/5 border border-white/10 p-2.5 rounded-2xl">
                  <input type="color" value={currentColor} onChange={e => setCurrentColor(e.target.value)} className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none" />
                  <input type="text" value={currentColor} readOnly className="flex-1 bg-transparent text-white font-mono text-xs uppercase outline-none opacity-60" />
               </div>
            </div>
            <div className="w-4 h-4 bg-[#111827]/90 border border-white/10 border-t-0 border-l-0 rotate-45 absolute bottom-[-8px] left-[112px]"></div>
          </Popover.Panel>
        </Transition>
      </Popover>

      {/* ERASER */}
      <button 
        onClick={handleEraser} 
        className={`${toolButtonClass} ${isEraser ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/50" : "text-white"}`}
      >
        <Eraser className="w-6 h-6" strokeWidth={1.5} />
        <span className={badgeClass}>E</span>
      </button>

      <div className="w-px h-8 bg-white/10 mx-1" />

      {/* CLEAR CANVAS */}
      <button onClick={resetCanvas} className={`${toolButtonClass} text-white/40 hover:text-red-400 hover:bg-red-500/10`}>
        <Trash2 className="w-5 h-5" strokeWidth={1.5} />
      </button>
    </div>
  )
}