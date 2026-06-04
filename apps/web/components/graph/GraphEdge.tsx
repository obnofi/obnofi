"use client";

import { memo } from "react";
import {
  BaseEdge,
  getStraightPath,
  type EdgeProps,
} from "@xyflow/react";

export const GraphEdge = memo(function GraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
}: EdgeProps) {
  const edgeData = (data ?? {}) as {
    thickness?: number;
    isUnresolved?: boolean;
    isActive?: boolean;
    isDimmed?: boolean;
  };

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  return (
    <BaseEdge
      id={String(id)}
      path={edgePath}
      style={{
        stroke: edgeData.isActive
          ? "var(--color-accent)"
          : "var(--color-text-placeholder)",
        strokeWidth: (edgeData.thickness ?? 1) * (edgeData.isActive ? 1.5 : 0.8),
        strokeDasharray: edgeData.isUnresolved ? "4 4" : undefined,
        opacity: edgeData.isDimmed ? 0.1 : edgeData.isUnresolved ? 0.4 : edgeData.isActive ? 0.85 : 0.65,
        animation: "graphEdgeFadeIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s backwards",
      }}
    />
  );
});
