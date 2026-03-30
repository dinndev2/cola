import { useRef, useLayoutEffect, useEffect, useState } from 'react'
import type { Socket } from 'socket.io-client';

interface CanvasType {
  brushSize: number
  currentColor: string
  socket: Socket | null;
  roomId: string;
  isEraser: boolean;
  isText: boolean
  err: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setCanvasKey: React.Dispatch<React.SetStateAction<number>>
  setIsText: React.Dispatch<React.SetStateAction<boolean>>
}

type CanvasEvent = React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>;

interface drawType {
  x: number; // Will represent % across width (0 to 1)
  y: number; // Will represent % across height (0 to 1)
  currentColor: string;
  brushSize: number;
  eraser: boolean;
}

interface textType {
  text: string;
  x: number; // %
  y: number; // %
  currentColor: string;
}

export const CanvasContainer = ({ err, setIsText, isText, isEraser, brushSize, currentColor, socket, roomId, canvasRef, setCanvasKey }: CanvasType) => {
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

  // 2. HELPER: COORDINATES (The Fix)
  const getCoordinates = (e: CanvasEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, nx: 0, ny: 0, clientX: 0, clientY: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;

    return { 
      x: localX, 
      y: localY, 
      nx: localX / rect.width, // Normalization
      ny: localY / rect.height, 
      clientX, 
      clientY 
    };
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
    const { nx, ny, clientX, clientY } = getCoordinates(e);
    setIsText(false);

    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed", left: `${clientX - 10}px`, top: `${clientY - 45}px`,
      zIndex: "2000", display: "flex", flexDirection: "column", padding: "10px",
      borderRadius: "14px", background: "rgba(255, 255, 255, 0.5)",
      backdropFilter: "blur(12px)", border: "1px solid rgba(255, 255, 255, 0.7)",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)", opacity: "0", transform: "translateY(10px) scale(0.95)"
    });

    const input = document.createElement("textarea");
    Object.assign(input.style, { background: "rgba(255, 255, 255, 0.8)", border: "none", outline: "none", font: "16px Arial", color: currentColor, padding: "8px 12px", borderRadius: "10px", resize: "none", minWidth: "200px" });

    container.appendChild(input);
    document.body.appendChild(container);
    requestAnimationFrame(() => { container.style.opacity = "1"; container.style.transform = "translateY(0) scale(1)"; });
    setTimeout(() => input.focus(), 50);

    input.oninput = () => {
      socket?.emit("typing-text", { roomId, x: nx, y: ny, text: input.value });
    };

    input.onblur = () => {
      const text = input.value.trim();
      if (text && canvasRef.current) {
        const lx = nx * canvasRef.current.offsetWidth;
        const ly = ny * canvasRef.current.offsetHeight;
        drawText(text, lx, ly, currentColor);
        socket?.emit("write", { roomId, text, x: nx, y: ny, currentColor });
      }
      socket?.emit("typing-text", { roomId, x: nx, y: ny, text: "" });
      document.body.removeChild(container);
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
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over';
    if (!eraser) ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath(); 
    ctx.moveTo(x, y);
    ctx.globalCompositeOperation = 'source-over';
  }; 

  // 5. SOCKET LISTENERS (The "Denormalization" Fix)
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDraw = ({ config }: { config: drawType }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Convert normalized values back to current local pixels
      const lx = config.x * canvas.offsetWidth;
      const ly = config.y * canvas.offsetHeight;
      paintLine(lx, ly, config.currentColor, config.brushSize, config.eraser);
    };

    const handleRemoteText = (config: textType) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const lx = config.x * canvas.offsetWidth;
      const ly = config.y * canvas.offsetHeight;
      drawText(config.text, lx, ly, config.currentColor);
    };

    const handleGhostText = ({ x, y, text, userId }: any) => {
      setGhostCarets(prev => ({ ...prev, [userId]: text ? { x, y, text } : undefined }));
    };

    const handleHistory = (history: any[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      history.forEach((step) => {
        const lx = step.x * canvas.offsetWidth;
        const ly = step.y * canvas.offsetHeight;
        if (step.text) {
          drawText(step.text, lx, ly, step.currentColor);
        } else {
          paintLine(lx, ly, step.currentColor, step.brushSize, step.eraser);
        }
      });
    };

    socket.on("draw-step", handleRemoteDraw);
    socket.on("write", handleRemoteText);
    socket.on("typing-text", handleGhostText);
    socket.on("draw-history", handleHistory);
    socket.on("remote-stop-drawing", () =>  {canvasRef.current?.getContext("2d")?.beginPath(); isDrawing.current = false;})
    socket.on("clear-canvas", () => setCanvasKey(prev => prev + 1));

    return () => {
      socket.off("draw-step");
      socket.off("write");
      socket.off("typing-text");
      socket.off("draw-history");
      socket.off("clear-canvas");
      socket.off("remote-stop-drawing");
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
    const { x, y, nx, ny } = getCoordinates(e);
    paintLine(x, y, currentColor, brushSize, isEraser);
    // Send normalized coordinates (nx, ny) as x and y
    socket?.emit('draw-step', { roomId, config: { x: nx, y: ny, currentColor, brushSize, eraser: isEraser } });
  };

  const handleStop = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const { nx, ny } = getCoordinates(e);
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.beginPath(); 
    socket?.emit("stop-drawing", {roomId, x: nx, y: ny});
  };

  // 7. RESIZE 
  // 7. RESIZE (Snapshots and Restores to prevent "deleting")
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      // Use requestAnimationFrame to sync with the browser's paint cycle
      window.requestAnimationFrame(() => {
        if (!entries[0] || !canvas) return;
        const { width, height } = entries[0].contentRect;
        
        // Safety check: if dimensions are 0, don't resize (prevents clearing)
        if (width <= 0 || height <= 0) return;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 1. Create a temporary "snapshot" of the current drawing
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          const tempCtx = tempCanvas.getContext('2d');
          
          if (tempCtx) {
            // Copy current pixels to the temp canvas
            tempCtx.drawImage(canvas, 0, 0);
            
            // 2. Now resize the real canvas (this clears it)
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            
            // 3. Reset the scaling for the new size
            ctx.setTransform(1, 0, 0, 1, 0, 0); 
            ctx.scale(dpr, dpr);
            
            // 4. Paste the snapshot back onto the new, resized canvas
            // We stretch/shrink the old image to fit the new dimensions
            ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height);
          }
        }
      });
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [dpr]);

  return (
    <div className="relative w-full h-full my-20 group">
      <p className="text-red-500 text-2xl font-bold">{err}</p>
      <canvas 
        ref={canvasRef}
        onMouseDown={handleStart} onMouseUp={handleStop} onMouseMove={handleMove} onMouseLeave={handleStop}
        onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleStop}
        className="rounded-[2.5rem] bg-[#fdfbf7] shadow-2xl w-full h-full block touch-none border border-white/10"
      />
      
      {Object.entries(ghostCarets).map(([id, caret]) => (
        caret && canvasRef.current && (
          <div 
            key={id} 
            className="absolute pointer-events-none text-blue-500/40 italic text-xs animate-pulse"
            style={{ 
              left: caret.x * canvasRef.current.offsetWidth, 
              top: caret.y * canvasRef.current.offsetHeight 
            }}
          >
            {caret.text}|
          </div>
        )
      ))}
    </div>
  );
};