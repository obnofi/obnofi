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
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  data: { size?: number; label?: unknown };
}

interface SimulationEdge extends SimulationLinkDatum<SimulationNode> {
  source: string;
  target: string;
}

// 노드의 충돌 반경 계산 (라벨 포함)
function getCollisionRadius(node: { data: { size?: number; label?: unknown } }) {
  const size = node.data.size ?? 10;
  const label = typeof node.data.label === "string" ? node.data.label : "";
  
  // 라벨 너비 추정 (글자당 7px)
  const labelWidth = Math.min(100, label.length * 7);
  // 노드 본체 크기
  const nodeWidth = size * 2;
  const nodeHeight = size * 2;
  
  // 실제 너비/높이
  const width = Math.max(nodeWidth, labelWidth);
  const height = nodeHeight + 20; // 라벨 공간 추가
  
  // 대각선의 절반 + 여유 공간
  return Math.hypot(width, height) / 2 + 40;
}

function getLinkNode(value: string | number | SimulationNode | undefined) {
  return typeof value === "object" && value !== null ? value : null;
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
  const simulationRef = useRef<ReturnType<typeof forceSimulation<SimulationNode>> | null>(null);
  const nodeMapRef = useRef<Map<string, SimulationNode>>(new Map());
  const isRunningRef = useRef(false);

  // 초기 레이아웃 - graphKey가 변경될 때만 실행
  useEffect(() => {
    if (nodes.length === 0) return;

    const isBig = nodes.length >= 500;

    // 초기 위치 설정 (원형 분포)
    const angleStep = (2 * Math.PI) / nodes.length;
    const radius = Math.max(300, nodes.length * 15);

    const simNodes: SimulationNode[] = nodes.map((node, i) => ({
      id: node.id,
      x: node.position.x || Math.cos(angleStep * i) * radius + (Math.random() - 0.5) * 100,
      y: node.position.y || Math.sin(angleStep * i) * radius + (Math.random() - 0.5) * 100,
      vx: 0,
      vy: 0,
      data: node.data,
    }));

    nodeMapRef.current = new Map(simNodes.map((n) => [n.id, n]));

    const simEdges: SimulationEdge[] = edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
    }));

    // 물리 시뮬레이션
    const simulation = forceSimulation(simNodes)
      .force(
        "charge",
        forceManyBody()
          .strength(isBig ? -600 : -1000)  // 강한 반발력
          .distanceMax(2000)
      )
      .force(
        "link",
        forceLink(simEdges)
          .id((n) => n.id)
          .distance((link) => {
            const s = getLinkNode(link.source);
            const t = getLinkNode(link.target);
            if (!s || !t) return 250;
            // 두 노드의 충돌 반경 합 + 여유
            return getCollisionRadius(s) + getCollisionRadius(t) + 80;
          })
          .strength(0.2)
      )
      .force(
        "collide",
        forceCollide<SimulationNode>()
          .radius((n) => getCollisionRadius(n))
          .strength(1)  // 최대 충돌 강도
          .iterations(3)
      )
      .force("center", forceCenter(0, 0))
      .alpha(1)
      .alphaDecay(0.02)
      .velocityDecay(0.4);

    simulationRef.current = simulation;
    isRunningRef.current = true;

    // 초기 레이아웃 수렴
    simulation.tick(isBig ? 80 : 150);

    // 초기 위치 적용
    setNodes((current) =>
      current.map((node) => {
        const simNode = nodeMapRef.current.get(node.id);
        if (!simNode) return node;
        return {
          ...node,
          position: { x: simNode.x, y: simNode.y },
        };
      })
    );

    // 지속적 업데이트
    simulation.on("tick", () => {
      if (!isRunningRef.current) return;
      
      setNodes((current) =>
        current.map((node) => {
          const simNode = nodeMapRef.current.get(node.id);
          if (!simNode) return node;
          return {
            ...node,
            position: { x: simNode.x, y: simNode.y },
          };
        })
      );
    });

    return () => {
      isRunningRef.current = false;
      simulation.stop();
      simulationRef.current = null;
    };
  }, [graphKey, setNodes]);

  // 드래그 처리 - nodes가 변경될 때 실행
  useEffect(() => {
    const simulation = simulationRef.current;
    if (!simulation) return;

    let hasDraggedNode = false;

    for (const node of nodes) {
      const simNode = nodeMapRef.current.get(node.id);
      if (!simNode) continue;

      if (node.dragging) {
        // 드래그 중인 노드는 마우스 위치로 즉시 이동
        simNode.fx = node.position.x;
        simNode.fy = node.position.y;
        hasDraggedNode = true;
      } else if (simNode.fx !== null || simNode.fy !== null) {
        // 드래그 종료 시 물리법칙 적용 재개
        simNode.fx = null;
        simNode.fy = null;
        hasDraggedNode = true;
      }
    }

    // 드래그 중일 때만 시뮬레이션 재시작
    if (hasDraggedNode) {
      simulation.alpha(0.3).restart();
    }
  }, [nodes]);
}
