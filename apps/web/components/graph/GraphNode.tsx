"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { GraphLinkNode } from "@/components/graph/useGraphData";

export type GraphCanvasNodeData = GraphLinkNode;

function getNodeColors(data: GraphCanvasNodeData) {
  if (data.isCurrentNote) {
    return {
      background: "var(--color-graph-current-subtle)",
      border: "var(--color-graph-current)",
      color: "var(--color-graph-current)",
    };
  }

  if (data.isUnresolved) {
    return {
      background: "var(--color-surface)",
      border: "var(--color-graph-unresolved)",
      color: "var(--color-graph-unresolved)",
    };
  }

  if (data.isOrphan) {
    return {
      background: "var(--color-surface)",
      border: "var(--color-border)",
      color: "var(--color-text-secondary)",
    };
  }

  return {
    background: "var(--color-accent-subtle)",
    border: "var(--color-accent)",
    color: "var(--color-accent)",
  };
}

export const GraphNode = memo(function GraphNode({
  data,
  selected,
}: NodeProps) {
  const nodeData = data as GraphCanvasNodeData;
  const size = typeof nodeData.size === "number" ? nodeData.size : 40;
  const colors = getNodeColors(nodeData);

  return (
    <div
      className="group relative flex items-center justify-center rounded-full text-center transition-transform"
      style={{
        width: size,
        height: size,
        background: colors.background,
        color: colors.color,
        border: `1px ${nodeData.isUnresolved ? "dashed" : "solid"} ${colors.border}`,
        boxShadow: selected
          ? `0 0 0 6px color-mix(in srgb, ${colors.border} 20%, transparent)`
          : undefined,
        opacity: nodeData.isOrphan ? 0.72 : 1,
      }}
      title={nodeData.label}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-0 !bg-transparent opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-0 !bg-transparent opacity-0"
      />
      <span
        className="pointer-events-none px-2 text-[11px] font-medium leading-tight"
        style={{
          maxWidth: Math.max(size - 10, 28),
          display: "-webkit-box",
          WebkitLineClamp: size >= 84 ? 3 : 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          wordBreak: "break-word",
        }}
      >
        {nodeData.label}
      </span>
      <div className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 rounded-md bg-[var(--color-background)] px-2 py-1 text-[11px] text-[var(--color-text-secondary)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {nodeData.backlinkCount} backlinks
      </div>
    </div>
  );
});
