import { useCallback, useRef, useState } from "react";
import type { CanvasLayer, Tool } from "@/lib/canvas/canvasTypes";
import {
  createId,
  getPointFromEvent,
  isPointNearLayer,
} from "@/lib/canvas/canvasUtils";

export function useCanvasDrawing(
  boardRef: React.RefObject<HTMLDivElement | null>,
  onUpdate?: (content: object) => void
) {
  const [layers, setLayers] = useState<CanvasLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState<CanvasLayer | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<CanvasLayer[][]>([]);
  const layersRef = useRef(layers);
  layersRef.current = layers;

  const persistLayers = useCallback(
    (nextLayers: CanvasLayer[]) => {
      setLayers(nextLayers);
      onUpdate?.({ version: 2, layers: nextLayers });
    },
    [onUpdate]
  );

  const pushHistory = useCallback(() => {
    setHistory((current) => [...current.slice(-29), layersRef.current]);
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, tool: Tool, color: string, size: number) => {
      const point = getPointFromEvent(event, boardRef.current);
      if (!point || tool === "select") return;

      event.currentTarget.setPointerCapture(event.pointerId);

      if (tool === "eraser") {
        pushHistory();
        setIsDrawing(true);
        setLayers((current) => current.filter((layer) => !isPointNearLayer(layer, point)));
        return;
      }

      pushHistory();
      setIsDrawing(true);

      if (tool === "brush") {
        setActiveLayer({ id: createId("stroke"), kind: "stroke", points: [point], color, size });
        return;
      }

      setActiveLayer({
        id: createId("shape"),
        kind: "shape",
        shape: tool === "line" ? "line" : tool === "rect" ? "rect" : "ellipse",
        start: point,
        end: point,
        color,
        size,
      });
    },
    [boardRef, pushHistory]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, tool: Tool) => {
      const point = getPointFromEvent(event, boardRef.current);
      if (!point || !isDrawing) return;

      if (tool === "eraser") {
        setLayers((current) => current.filter((layer) => !isPointNearLayer(layer, point)));
        return;
      }

      setActiveLayer((current) => {
        if (!current) return current;
        if (current.kind === "stroke") return { ...current, points: [...current.points, point] };
        return { ...current, end: point };
      });
    },
    [boardRef, isDrawing]
  );

  const finishDrawing = useCallback(
    (tool: Tool) => {
      if (!isDrawing) return;
      setIsDrawing(false);

      if (tool === "eraser") {
        onUpdate?.({ version: 2, layers: layersRef.current });
        return;
      }

      setActiveLayer((current) => {
        if (!current) return null;
        if (current.kind === "stroke" && current.points.length < 2) return null;
        persistLayers([...layersRef.current, current]);
        return null;
      });
    },
    [isDrawing, onUpdate, persistLayers]
  );

  const handleClear = useCallback(() => {
    if (layersRef.current.length === 0) return;
    pushHistory();
    persistLayers([]);
  }, [persistLayers, pushHistory]);

  const handleUndo = useCallback(() => {
    setHistory((current) => {
      const previous = current[current.length - 1];
      if (!previous) return current;
      persistLayers(previous);
      return current.slice(0, -1);
    });
  }, [persistLayers]);

  return {
    layers,
    setLayers,
    activeLayer,
    isDrawing,
    history,
    handlePointerDown,
    handlePointerMove,
    finishDrawing,
    handleClear,
    handleUndo,
    persistLayers,
  };
}
