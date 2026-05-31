import type { CursorPosition } from "../../types/index";

interface Props {
  cursors: CursorPosition[];
  scale: number;
}

export function CursorOverlay({ cursors, scale }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {cursors.map((c) => (
        <div
          key={c.uid}
          className="absolute"
          style={{
            left: c.x * scale,
            top: c.y * scale,
            transform: "translate(-2px, -2px)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M0 0 L0 12 L3.5 9 L6 14 L7.5 13.5 L5 8.5 L9 8.5 Z" fill="#4f46e5" />
          </svg>
          <span className="absolute left-4 top-0 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap">
            {c.displayName}
          </span>
        </div>
      ))}
    </div>
  );
}