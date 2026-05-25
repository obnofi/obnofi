"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  PencilRuler,
  Trash2,
  Undo2,
} from "lucide-react";
import { catmullRomToBezierPath } from "@/lib/pathUtils";
import type { Tool } from "@/lib/canvas/canvasTypes";
import { PALETTE } from "@/lib/canvas/canvasTypes";
import {
  normalizeLegacyContent,
  renderShape,
} from "@/lib/canvas/canvasUtils";
import { useCanvasDrawing } from "@/hooks/useCanvasDrawing";

interface CanvasProps {
  content: object | null;
  onUpdate?: (content: object) => void;
  compact?: boolean;
}

export function Canvas({ content, onUpdate, compact = false }: CanvasProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("brush");
  const [color, setColor] = useState("#2E7D45");
  const [size, setSize] = useState(4);

  const {
    layers,
    setLayers,
    activeLayer,
    history,
    handlePointerDown,
    handlePointerMove,
    finishDrawing,
    handleClear,
    handleUndo,
  } = useCanvasDrawing(boardRef, onUpdate);

  useEffect(() => {
    const normalized = normalizeLegacyContent(content);
    setLayers(normalized.layers);
  }, [content]);

  useEffect(() => {
    if (compact) {
      setTool("brush");
    }
  }, [compact]);

  const renderedLayers = useMemo(() => {
    return activeLayer ? [...layers, activeLayer] : layers;
  }, [activeLayer, layers]);

  return (
    <div data-testid={compact ? "inline-canvas" : "workspace-canvas"} className="flex h-full flex-col bg-white dark:bg-[#111110]">
      <div
        ref={boardRef}
        data-testid="canvas-board"
        className={`relative flex-1 overflow-hidden ${
          tool === "select" ? "cursor-default" : "cursor-crosshair"
        }`}
        onPointerDown={(e) => handlePointerDown(e, tool, color, size)}
        onPointerMove={(e) => handlePointerMove(e, tool)}
        onPointerUp={() => finishDrawing(tool)}
        onPointerLeave={() => finishDrawing(tool)}
      >
        <div className="absolute left-3 right-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white/92 px-3 py-3 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/92">
          <div className="flex items-center gap-2">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  color === swatch
                    ? "scale-110 border-zinc-900 dark:border-white"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: swatch }}
                aria-label={`Select color ${swatch}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
            <PencilRuler className="h-4 w-4 text-zinc-400" />
            <input
              name="brush-size"
              type="range"
              min={2}
              max={24}
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
            />
            <span className="w-7 text-xs text-zinc-500 dark:text-zinc-400">{size}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Undo2 className="h-4 w-4" />
              {compact ? <span className="hidden sm:inline">Undo</span> : "Undo"}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              {compact ? <span className="hidden sm:inline">Clear</span> : "Clear"}
            </button>
          </div>
        </div>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(46,125,69,0.16) 1px, transparent 0)",
            backgroundSize: "22px 22px",
          }}
        />

        <svg className="absolute inset-0 h-full w-full touch-none">
          {renderedLayers.map((layer) =>
            layer.kind === "stroke" ? (
              <path
                key={layer.id}
                d={catmullRomToBezierPath(layer.points)}
                fill="none"
                stroke={layer.color}
                strokeWidth={layer.size}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              renderShape(layer)
            )
          )}
        </svg>

      </div>
    </div>
  );
}
