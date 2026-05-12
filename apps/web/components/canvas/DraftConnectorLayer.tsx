"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

export interface DraftConnectorApi {
  update(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string,
    strokeWidth: number,
    arrowEnd: boolean,
    lineStyle: "solid" | "dashed" | "dotted"
  ): void;
  hide(): void;
}

export const DraftConnectorLayer = forwardRef<DraftConnectorApi>(
  function DraftConnectorLayer(_, ref) {
    const lineRef = useRef<SVGLineElement>(null);
    const markerPathRef = useRef<SVGPathElement>(null);

    useImperativeHandle(
      ref,
      () => ({
        update(x1, y1, x2, y2, color, strokeWidth, arrowEnd, lineStyle) {
          const line = lineRef.current;
          if (!line) return;
          line.setAttribute("x1", String(x1));
          line.setAttribute("y1", String(y1));
          line.setAttribute("x2", String(x2));
          line.setAttribute("y2", String(y2));
          line.setAttribute("stroke", color);
          line.setAttribute("stroke-width", String(strokeWidth));
          line.setAttribute(
            "stroke-dasharray",
            lineStyle === "dashed" ? "8 4" : lineStyle === "dotted" ? "2 4" : ""
          );
          if (markerPathRef.current) {
            markerPathRef.current.setAttribute("fill", color);
          }
          line.setAttribute(
            "marker-end",
            arrowEnd ? "url(#draft-connector-arrowhead)" : ""
          );
          line.style.display = "";
        },
        hide() {
          if (lineRef.current) lineRef.current.style.display = "none";
        },
      }),
      []
    );

    return (
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ overflow: "visible", zIndex: 99 }}
      >
        <defs>
          <marker
            id="draft-connector-arrowhead"
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            viewBox="0 0 8 8"
          >
            <path
              ref={markerPathRef}
              d="M 0 0 L 8 4 L 0 8 z"
              fill="#2E7D45"
            />
          </marker>
        </defs>
        <line
          ref={lineRef}
          stroke="#2E7D45"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ display: "none" }}
        />
      </svg>
    );
  }
);
