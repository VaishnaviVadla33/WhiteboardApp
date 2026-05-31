import { useRef, useState, useEffect } from "react";
import { useWhiteboard } from "../../hooks/useWhiteboard";
import { CursorOverlay } from "./CursorOverlay";
import { Toolbar } from "./Toolbar";

interface Props {
  projectId: string;
  uid: string;
  displayName: string;
}

// Virtual canvas size — same for all devices
const VIRTUAL_WIDTH = 1400;
const VIRTUAL_HEIGHT = 900;

export function WhiteboardCanvas({ projectId, uid, displayName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(3);
  const [scale, setScale] = useState(1);
  const isDrawing = useRef(false);
  const currentPoints = useRef<{ x: number; y: number }[]>([]);

  const { strokes, cursors, permissionError, saveStroke, clearBoard, updateCursor } =
    useWhiteboard(projectId, uid, displayName);

  // Compute scale so canvas fits container
  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const availableHeight = rect.height - 56; // toolbar height
      const scaleX = rect.width / VIRTUAL_WIDTH;
      const scaleY = availableHeight / VIRTUAL_HEIGHT;
      setScale(Math.min(scaleX, scaleY));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  // Attach touch events manually with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const rect = canvas.getBoundingClientRect();
      currentPoints.current = [{
        x: (e.touches[0].clientX - rect.left) / scale,
        y: (e.touches[0].clientY - rect.top) / scale,
      }];
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isDrawing.current) return;
      const rect = canvas.getBoundingClientRect();
      const pos = {
        x: (e.touches[0].clientX - rect.left) / scale,
        y: (e.touches[0].clientY - rect.top) / scale,
      };
      drawLive(pos);
    };

    const handleTouchEnd = async () => {
      await onMouseUp();
    };

    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd);

    return () => {
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", handleTouchEnd);
    };
  }, [scale, tool, color, brushSize]); // re-attach when scale changes

  // Redraw canvas whenever strokes change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === "eraser" ? "#ffffff" : stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      stroke.points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.stroke();
    });
  }, [strokes]);

  // Convert screen coords → virtual canvas coords
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Convert from scaled display coords to virtual coords
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  const onMouseDown = (e: React.MouseEvent) => {
    isDrawing.current = true;
    currentPoints.current = [getPos(e)];
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const pos = getPos(e);
    updateCursor(pos.x, pos.y);
    if (!isDrawing.current) return;
    drawLive(pos);
  };

  const drawLive = (pos: { x: number; y: number }) => {
    currentPoints.current.push(pos);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pts = currentPoints.current;
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth = tool === "eraser" ? 20 : brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
    ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.stroke();
  };

  const onMouseUp = async () => {
    if (!isDrawing.current || currentPoints.current.length < 2) return;
    isDrawing.current = false;
    await saveStroke({
      points: currentPoints.current,
      color,
      width: tool === "eraser" ? 20 : brushSize,
      tool,
      userId: uid,
      timestamp: Date.now(),
    });
    currentPoints.current = [];
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-100 flex flex-col"
    >
      {permissionError && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl text-center">
            <p className="text-lg font-semibold text-red-600 mb-2">Access Denied</p>
            <p className="text-gray-600">You have been removed from this project</p>
          </div>
        </div>
      )}

      <Toolbar
        tool={tool} setTool={setTool}
        color={color} setColor={setColor}
        brushSize={brushSize} setBrushSize={setBrushSize}
        onClear={clearBoard}
      />

      {/* Scaled canvas wrapper */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div
          style={{
            width: VIRTUAL_WIDTH * scale,
            height: VIRTUAL_HEIGHT * scale,
            position: "relative",
            boxShadow: "0 2px 16px rgba(0,0,0,0.10)",
            borderRadius: 8,
            background: "white",
          }}
        >
          <canvas
            ref={canvasRef}
            width={VIRTUAL_WIDTH}
            height={VIRTUAL_HEIGHT}
            style={{
                width: VIRTUAL_WIDTH * scale,
                height: VIRTUAL_HEIGHT * scale,
                display: "block",
                touchAction: "none",
            }}
            className="cursor-crosshair rounded-lg"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            />
          <CursorOverlay cursors={cursors} scale={scale} />
        </div>
      </div>
    </div>
  );
}