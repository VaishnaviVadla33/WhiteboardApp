const COLORS = ["#000000","#ef4444","#3b82f6","#22c55e","#f59e0b","#8b5cf6","#ec4899","#ffffff"];

interface Props {
  tool: "pen" | "eraser";
  setTool: (t: "pen" | "eraser") => void;
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  onClear: () => void;
}

export function Toolbar({ tool, setTool, color, setColor, brushSize, setBrushSize, onClear }: Props) {
  return (
    <div className="flex-shrink-0 flex flex-wrap items-center justify-center gap-2 bg-white border-b border-gray-200 shadow-sm px-3 py-2 w-full z-10">
      {/* Tools */}
      <button onClick={() => setTool("pen")}
        className={`px-2 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition ${tool === "pen" ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}>
        ✏️ <span className="hidden sm:inline">Pen</span>
      </button>
      <button onClick={() => setTool("eraser")}
        className={`px-2 md:px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition ${tool === "eraser" ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}>
        🧹 <span className="hidden sm:inline">Eraser</span>
      </button>

      <div className="hidden md:block w-px h-6 bg-gray-300" />

      {/* Colors */}
      <div className="flex gap-1 flex-wrap justify-center">
        {COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-5 h-5 md:w-6 md:h-6 rounded-full border-2 transition ${color === c ? "border-gray-900 scale-125" : "border-transparent"}`}
            style={{ backgroundColor: c }} />
        ))}
      </div>

      {/* Brush size */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-600 hidden sm:inline">Size:</span>
        <input type="range" min={1} max={20} value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-16 md:w-20" />
        <span className="text-xs text-gray-600 w-4 hidden sm:inline">{brushSize}</span>
      </div>

      <button onClick={onClear}
        className="text-xs md:text-sm text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition">
        Clear
      </button>
    </div>
  );
}