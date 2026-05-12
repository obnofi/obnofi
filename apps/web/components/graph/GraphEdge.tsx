"use client";

import { memo } from "react";
import {
  BaseEdge,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";

export const GraphEdge = memo(function GraphEdge({
  id,
  source,
  target,
  data,
}: EdgeProps) {
  const edgeData = (data ?? {}) as { thickness?: number; isUnresolved?: boolean };
  const sourceNode = useInternalNode(String(source));
  const targetNode = useInternalNode(String(target));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const sourceWidth = sourceNode.measured?.width ?? sourceNode.width ?? 0;
  const sourceHeight = sourceNode.measured?.height ?? sourceNode.height ?? 0;
  const targetWidth = targetNode.measured?.width ?? targetNode.width ?? 0;
  const targetHeight = targetNode.measured?.height ?? targetNode.height ?? 0;

  const [edgePath] = getStraightPath({
    sourceX: sourceNode.internals.positionAbsolute.x + sourceWidth / 2,
    sourceY: sourceNode.internals.positionAbsolute.y + sourceHeight / 2,
    targetX: targetNode.internals.positionAbsolute.x + targetWidth / 2,
    targetY: targetNode.internals.positionAbsolute.y + targetHeight / 2,
  });

  return (
    <BaseEdge
      id={String(id)}
      path={edgePath}
      style={{
        stroke: edgeData.isUnresolved
          ? "var(--color-graph-unresolved)"
          : "var(--color-text-secondary)",
        strokeWidth: edgeData.thickness ?? 1,
        strokeDasharray: edgeData.isUnresolved ? "6 5" : undefined,
        opacity: edgeData.isUnresolved ? 0.85 : 0.55,
      }}
    />
  );
});
