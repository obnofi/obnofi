"use client";

import { useEffect, useRef } from "react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force";
import type { Edge, Node } from "@xyflow/react";

interface SimulationNode extends SimulationNodeDatum {
  id: string;
  x: number;
  y: number;
  data: {
    size?: number;
  };
}

interface SimulationEdge extends SimulationLinkDatum<SimulationNode> {
  source: string;
  target: string;
}

interface UseGraphSimulationParams {
  nodes: Array<Node<{ size?: number }, "graphNode">>;
  edges: Array<Edge<{ thickness?: number }, "graphEdge">>;
  graphKey: string;
  setNodes: React.Dispatch<React.SetStateAction<Array<Node<{ size?: number }, "graphNode">>>>;
}

export function useGraphSimulation({
  nodes,
  edges,
  graphKey,
  setNodes,
}: UseGraphSimulationParams) {
  const initialNodesRef = useRef(nodes);

  useEffect(() => {
    initialNodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    const initialNodes = initialNodesRef.current;

    if (initialNodes.length === 0) {
      return;
    }

    const simulationNodes: SimulationNode[] = initialNodes.map((node) => ({
      id: node.id,
      x: node.position.x,
      y: node.position.y,
      fx: node.dragging ? node.position.x : null,
      fy: node.dragging ? node.position.y : null,
      data: node.data,
    }));

    const simulationEdges: SimulationEdge[] = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    const simulation = forceSimulation(simulationNodes)
      .force(
        "charge",
        forceManyBody()
          .strength(initialNodes.length >= 500 ? -90 : -140)
          .theta(initialNodes.length >= 500 ? 0.9 : 0.8)
      )
      .force(
        "link",
        forceLink(simulationEdges)
          .id((node) => node.id)
          .distance(80)
      )
      .force(
        "collide",
        forceCollide<SimulationNode>().radius((node) => ((node.data.size ?? 40) / 2) + 12)
      )
      .force("center", forceCenter(0, 0))
      .alpha(1)
      .alphaMin(0.02)
      .alphaDecay(0.12)
      .velocityDecay(0.35);

    simulation.on("tick", () => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const next = simulationNodes.find((simulationNode) => simulationNode.id === node.id);
          if (!next) {
            return node;
          }

          return {
            ...node,
            position: {
              x: next.x ?? node.position.x,
              y: next.y ?? node.position.y,
            },
          };
        })
      );

      if (simulation.alpha() <= 0.02) {
        simulation.stop();
      }
    });

    return () => {
      simulation.stop();
    };
  }, [edges, graphKey, setNodes]);
}
