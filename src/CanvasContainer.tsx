import { useRef, useLayoutEffect, useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client';

interface CanvasType {
  brushSize: number
  currentColor: string
  socket: Socket | null;
  roomId: string;
  isEraser: boolean;
  isText: boolean
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setCanvasKey: React.Dispatch<React.SetStateAction<number>>
  setIsText: React.Dispatch<React.SetStateAction<boolean>>
}

type CanvasEvent = React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>;

interface drawType {
  x: number;
  y: number;
  currentColor: string;
  brushSize: number;
  eraser: boolean;
}

interface textType {
  text: string;
  x: number;
  y: number;
  currentColor: string;
}

export const CanvasContainer = ({ setIsText, isText, isEraser, brushSize, currentColor, socket, roomId, canvasRef, setCanvasKey }: CanvasType) => {
  const isDrawing = useRef(false);
  const dpr = window.devicePixelRatio || 1;
  const [ghostCarets, setGhostCarets] = useState<Record<string, { x: number, y: number, text: string }>>({});

  // 1. KEYBOARD SHORTCUTS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key.toLowerCase();
      if (key === 't') setIsText(true);
      if (key === 'b') setIsText(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsText]);

  // 2. HELPER: COORDINATES
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, clientX: 0, clientY: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top, clientX, clientY };
  };

  // 3. TEXT LOGIC
  const drawText = (text: string, x: number, y: number, color: string) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.font = "16px Arial";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  const mountInput = (e: CanvasEvent) => {
    const { x, y, clientX, clientY } = getCoordinates(e);
    setIsText(false);

    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      left: `${clientX - 10}px`,
      top: `${clientY - 45}px`,
      zIndex: "2000",
      display: "flex",
      flexDirection: "column",
      padding: "10px",
      borderRadius: "14px",
      background: "rgba(255, 255, 255, 0.5)",
      backdropFilter: "blur(12px)",
      webkitBackdropFilter: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.7)",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      opacity: "0",
      transform: "translateY(10px) scale(0.95)"
    });

    const tip = document.createElement("div");
    tip.innerHTML = `<span style="opacity: 0.5">PRESS</span> ↵ <span style="opacity: 0.5">TO SAVE</span>`;
    Object.assign(tip.style, { fontSize: "9px", fontWeight: "800", color: "#1f2937", marginBottom: "8px", textAlign: "center", pointerEvents: "none" });

    const input = document.createElement("textarea");
    Object.assign(input.style, { background: "rgba(255, 255, 255, 0.8)", border: "none", outline: "none", font: "16px 'Inter', sans-serif", color: currentColor, padding: "8px 12px", borderRadius: "10px", resize: "none", minWidth: "200px", height: "32px", overflow: "hidden" });

    container.appendChild(tip);
    container.appendChild(input);
    document.body.appendChild(container);

    requestAnimationFrame(() => {
      container.style.opacity = "1";
      container.style.transform = "translateY(0) scale(1)";
    });

    setTimeout(() => input.focus(), 50);

    input.oninput = () => {
      socket?.emit("typing-text", { roomId, x, y, text: input.value });
      input.style.width = `${Math.max(200, input.value.length * 10)}px`;
    };

    input.onkeydown = (event) => {
      if (event.key === 'Enter') { event.preventDefault(); input.blur(); }
      if (event.key === 'Escape') { input.value = ""; input.blur(); }
    };

    input.onblur = () => {
      const text = input.value.trim();
      if (text) {
        drawText(text, x, y, currentColor);
        socket?.emit("write", { roomId, text, x, y, currentColor });
      }
      socket?.emit("typing-text", { roomId, x, y, text: "" });
      container.style.opacity = "0";
      container.style.transform = "translateY(-10px)";
      setTimeout(() => { if (document.body.contains(container)) document.body.removeChild(container); }, 300);
    };
  };

  // 4. PURE DRAWING LOGIC
  const paintLine = (x: number, y: number, color: string, size: number, eraser: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    if (eraser) {
      ctx.globalCompositeOperation = 'destination-out'; 
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath(); 
    ctx.moveTo(x, y);
    if (eraser) ctx.globalCompositeOperation = 'source-over';
  }; 

  // 5. SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;
    const handleRemoteDraw = ({ config }: { config: drawType }) => paintLine(config.x, config.y, config.currentColor, config.brushSize, config.eraser);
    const handleRemoteText = (config: textType) => drawText(config.text, config.x, config.y, config.currentColor);
    const handleGhostText = ({ x, y, text, userId }: any) => setGhostCarets(prev => ({ ...prev, [userId]: text ? { x, y, text } : undefined }));
    const handleHistory = (history: any[]) => {
      history.forEach((step) => {
        if (step.text) {
          drawText(step.text, step.x, step.y, step.currentColor);
        } else if (step.type === 'draw') {
          paintLine(step.x, step.y, step.currentColor, step.brushSize, step.eraser);
        }
      });
    };

    socket.on("draw-step", handleRemoteDraw);
    socket.on("write", handleRemoteText);
    socket.on("typing-text", handleGhostText);
    socket.on("draw-history", handleHistory);
    socket.on("clear-canvas", () => setCanvasKey(prev => prev + 1));

    return () => {
      socket.off("draw-step");
      socket.off("write");
      socket.off("typing-text");
      socket.off("draw-history");
      socket.off("clear-canvas");
    };
  }, [socket, setCanvasKey]);

  // 6. EVENT HANDLERS
  const handleStart = (e: CanvasEvent) => {
    if (isText) { mountInput(e); return; }
    isDrawing.current = true;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  };

  const handleMove = (e: CanvasEvent) => {
    if (!isDrawing.current || isText) return;
    const { x, y } = getCoordinates(e);
    paintLine(x, y, currentColor, brushSize, isEraser);
    socket?.emit('draw-step', { roomId, config: { x, y, currentColor, brushSize, eraser: isEraser } });
  };

  const handleStop = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    socket?.emit("stop-drawing", roomId);
  };

  // 7. RESIZE (FIXED FOR MOBILE 0-DIMENSION ERRORS)
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!entries[0] || !canvas) return;
        const { width, height } = entries[0].contentRect;
        
        // --- DEFENSIVE CHECK: Exit if dimensions are 0 (prevents InvalidStateError) ---
        if (width <= 0 || height <= 0 || canvas.width <= 0 || canvas.height <= 0) return;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          try {
            // Buffer the current canvas state before resizing
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            if (tempCtx) {
              tempCtx.drawImage(canvas, 0, 0);
              
              // Apply new dimensions
              canvas.width = width * dpr;
              canvas.height = height * dpr;
              
              // Restore scaling
              ctx.setTransform(1, 0, 0, 1, 0, 0); 
              ctx.scale(dpr, dpr);
              
              // Redraw buffered image back onto scaled canvas
              ctx.drawImage(tempCanvas, 0, 0, width, height);
            }
          } catch (err) {
            console.warn("Canvas resize failed gracefully:", err);
          }
        }
      });
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [dpr]);

  return (
    <div className="relative w-full h-full my-20 group">
      <div className="absolute top-4 left-4 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="px-3 py-1 rounded-full bg-white/50 backdrop-blur-md border border-white/20 text-[10px] font-bold uppercase tracking-widest shadow-sm">
          Mode: {isText ? "Text (T)" : "Brush (B)"}
        </span>
      </div>

      <canvas 
        ref={canvasRef}
        onMouseDown={handleStart} 
        onMouseUp={handleStop}
        onMouseMove={handleMove}
        onMouseLeave={handleStop}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleStop}
        className="rounded-xl bg-yellow-50/80 shadow-2xl w-full h-full block touch-none cursor-crosshair border border-white/40"
      />
      
      {Object.entries(ghostCarets).map(([id, caret]) => (
        caret && (
          <div 
            key={id} 
            className="absolute pointer-events-none text-gray-400 italic text-sm border-l-2 border-blue-400 pl-2 animate-pulse"
            style={{ left: caret.x, top: caret.y }}
          >
            {caret.text}
          </div>
        )
      ))}
    </div>
  );
};