import { useRef, useLayoutEffect, useEffect } from 'react'
import type { Socket } from 'socket.io-client';

interface CanvasType {
  brushSize: number
  currentColor: string
  socket: Socket | null;
  roomId: string;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  setCanvasKey: React.Dispatch<React.SetStateAction<number>>
}

interface drawType {
  x: number
  y: number
  currentColor: string
  brushSize: number
}

export const CanvasContainer = ({ brushSize, currentColor, socket, roomId, canvasRef, setCanvasKey }: CanvasType) => {
  const isDrawing = useRef(false);
  const dpr = window.devicePixelRatio || 1;
  // 1. PURE DRAWING LOGIC
  // This function doesn't care about mouse state or sockets. It just paints.
  const paintLine = (x: number, y: number, color: string, size: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  // 2. SOCKET LISTENERS
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDraw = ({ config }: { config: drawType }) => {
      paintLine(config.x, config.y, config.currentColor, config.brushSize);
    };

    const handleRemoteStop = () => {
      canvasRef.current?.getContext("2d")?.beginPath();
    };

    const handleHistory = (history: any[]) => {
      history.forEach((step) => {
        if (step.type === 'draw') {
          paintLine(step.x, step.y, step.currentColor, step.brushSize);
        } else if (step.type === 'stop') {
          canvasRef.current?.getContext("2d")?.beginPath();
        }
      });
    };

    const clearCanvas = () => {
      setCanvasKey(prev => prev + 1)
    }

    socket.on("draw-step", handleRemoteDraw);
    socket.on("remote-stop-drawing", handleRemoteStop);
    socket.on("draw-history", handleHistory);
    socket.on("clear-canvas", clearCanvas);

    return () => {
      socket.off("draw-step");
      socket.off("remote-stop-drawing");
      socket.off("draw-history");
      socket.off("clear-canvas");
    };
  }, [socket]);

  // 3. MOUSE EVENT HANDLERS
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.beginPath();
    ctx?.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;

    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;

    // Draw locally immediately
    paintLine(x, y, currentColor, brushSize);

    // Send to server
    socket?.emit('draw-step', {
      roomId,
      config: { x, y, currentColor, brushSize }
    });
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    canvasRef.current?.getContext("2d")?.beginPath();
    socket?.emit("stop-drawing", roomId);
  };

  // 4. RESIZE LOGIC (Kept from your original)
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvas.width;
          tempCanvas.height = canvas.height;
          tempCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.setTransform(1, 0, 0, 1, 0, 0); 
          ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
          ctx.scale(dpr, dpr);
        }
      }
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [dpr]);

  return (
    <canvas 
      ref={canvasRef}
      onMouseDown={startDrawing} 
      onMouseUp={stopDrawing}
      onMouseMove={onMouseMove}
      onMouseLeave={stopDrawing}
      className="rounded-md bg-yellow-50 my-20 w-full h-full block touch-none"
    />
  );
};