import { Popover, Transition } from '@headlessui/react' 
import { Brush, Palette, Trash2 } from 'lucide-react' // Clean SVG icons
import { type Socket } from 'socket.io-client'

interface ToolsType {
  setBrushSize: React.Dispatch<React.SetStateAction<number>>
  brushSize: number
  setCurrentColor: React.Dispatch<React.SetStateAction<string>>
  setCanvasKey: React.Dispatch<React.SetStateAction<number>>
  currentColor: string 
  socket: Socket | null
  roomId: string

}

// Helper for generic tool button styles
const toolButtonClass = `
  p-3.5 rounded-2xl flex items-center justify-center 
  transition-all duration-300
  cursor-pointer
  hover:bg-white/10 active:scale-95
  border border-white/5 hover:border-white/10
`;

export default function Tools({ setBrushSize, brushSize, setCurrentColor, currentColor, setCanvasKey, socket, roomId }: ToolsType) {
  // Common colors for quick-picker
  const quickColors = ["#22c55e", "#ef4444", "#3b82f6", "#eab308", "#111827", "#f9fafb"]; 

  const resetCanvas = () => {
    socket?.emit("clear-canvas", roomId)
    setCanvasKey((prev) => prev + 1)
  } 
  return (
    // THE GLASS CONTAINER
    <div className="
      fixed bottom-5 left-1/2 -translate-x-1/2 
      bg-[#0b0f1a]/50 backdrop-blur-xl 
      border border-white/10 
      p-4 px-6 rounded-[2rem] 
      flex items-center gap-4 
      shadow-[0_25px_80px_-15px_rgba(0,0,0,0.5)]
      z-50
    ">
      
      {/* 1. BRUSH SIZE POPOVER */}
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className={`${toolButtonClass} ${open ? 'bg-white/10' : ''} text-white`}>
              <Brush className="w-6 h-6" strokeWidth={1.5} />
            </Popover.Button>

            <Transition
              enter="transition duration-150 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-100 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Popover.Panel className="absolute bottom-full mb-6 -left-10 z-10">
                {/* GLASS PANEL (appeared content) */}
                <div className="bg-[#111827]/80 backdrop-blur-lg border border-white/10 p-6 rounded-3xl shadow-2xl w-64">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Brush Size</span>
                      <span className="text-xl font-black text-white">{brushSize}px</span>
                   </div>
                   
                   {/* CUSTOM SLIDER */}
                   <input 
                    type="range" 
                    min="1" 
                    max="100" 
                    value={brushSize}
                    onChange={e => setBrushSize(parseInt(e.target.value))}
                    className="
                      w-full h-2 rounded-full cursor-pointer
                      bg-slate-700
                      accent-blue-500
                    "
                   />
                </div>
                {/* Tiny arrow pointing down */}
                <div className="w-3 h-3 bg-[#111827]/80 backdrop-blur-lg border border-white/10 border-t-0 border-l-0 rotate-45 absolute bottom-[-7px] left-[55px]"></div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
      <div className="w-px h-10 bg-white/5" /> {/* Separator */}
      {/* 2. COLOR PICKER POPOVER */}
      <Popover className="relative">
        {({ open }) => (
          <>
            <Popover.Button className={`${toolButtonClass} ${open ? 'bg-white/10' : ''}`}>
              <div className="relative">
                 <Palette className="w-6 h-6 text-white" strokeWidth={1.5} />
                 {/* Circle showing current color */}
                 <div style={{ backgroundColor: currentColor }} className="absolute -bottom-1.5 -right-1.5 w-4 h-4 rounded-full border-2 border-[#111827] animate-pulse"></div>
              </div>
            </Popover.Button>

            <Transition
              enter="transition duration-150 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-100 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <Popover.Panel className="absolute bottom-full mb-6 -right-10 z-10">
                {/* GLASS PANEL (appeared content) */}
                <div className="bg-[#111827]/80 backdrop-blur-lg border border-white/10 p-6 rounded-3xl shadow-2xl w-72">
                   <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Palette</div>
                   
                   {/* QUICK PICKER */}
                   <div className="grid grid-cols-6 gap-3 mb-5">
                      {quickColors.map(color => (
                        <button key={color} onClick={() => setCurrentColor(color)} style={{ backgroundColor: color }} className={`w-8 h-8 rounded-xl ${currentColor === color ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#111827]' : ''}`}></button>
                      ))}
                   </div>
                   
                   {/* ADVANCED PICKER BUTTON */}
                   <div className="flex gap-4 items-center bg-slate-800/50 border border-white/5 p-2 px-3 rounded-xl">
                      <input 
                        type="color" 
                        value={currentColor}
                        onChange={e => setCurrentColor(e.target.value)}
                        className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-none"
                      />
                      <input type="text" value={currentColor} readOnly className="flex-1 bg-transparent text-white font-mono uppercase text-sm outline-none" />
                   </div>
                </div>
                {/* Tiny arrow pointing down */}
                <div className="w-3 h-3 bg-[#111827]/80 backdrop-blur-lg border border-white/10 border-t-0 border-l-0 rotate-45 absolute bottom-[-7px] right-[55px]"></div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
      <div className="w-px h-10 bg-white/5" /> {/* Separator */}
      <Popover className="relative">
        <Popover.Button onClick={resetCanvas} className={`${toolButtonClass}text-white`}>
          <Trash2 className="w-6 h-6" strokeWidth={1.5} />
        </Popover.Button>
      </Popover>

    </div>
  )
}