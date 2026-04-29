"use client";

import { memo } from "react";
import {
  BaseEdge,
  getStraightPath,
  useInternalNode,
  type EdgeProps,
} from "@xyflow/react";

function getNodeBounds(node: NonNullable<ReturnType<typeof useInternalNode>>) {
  const width = node.measured?.width ?? node.width ?? 0;
  const height = node.measured?.height ?? node.height ?? 0;

  return {
    width,
    height,
    x: node.internals.positionAbsolute.x,
    y: node.internals.positionAbsolute.y,
    centerX: node.internals.positionAbsolute.x + width / 2,
    centerY: node.internals.positionAbsolute.y + height / 2,
  };
}

function getCenteredAnchorPoints(
  sourceNode: NonNullable<ReturnType<typeof useInternalNode>>,
  targetNode: NonNullable<ReturnType<typeof useInternalNode>>
) {
  const sourceBounds = getNodeBounds(sourceNode);
  const targetBounds = getNodeBounds(targetNode);

  return {
    sourceX: sourceBounds.centerX,
    sourceY: sourceBounds.centerY,
    targetX: targetBounds.centerX,
    targetY: targetBounds.centerY,
  };
}

export const FloatingGraphEdge = memo(function FloatingGraphEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  interactionWidth,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sourceX, sourceY, targetX, targetY } = getCenteredAnchorPoints(
    sourceNode,
    targetNode
  );

  const [edgePath] = getStraightPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={style}
      interactionWidth={interactionWidth}
    />
  );
});
