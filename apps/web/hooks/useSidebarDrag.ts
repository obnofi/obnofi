"use client";

import { useState, useCallback } from "react";
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from "@dnd-kit/core";
import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { usePageStore } from "@/store/pageStore";
import {
  collectDescendantIds,
  getProjectedDropPosition,
  getReorderedSiblingIds,
  PAGE_ORDER_STEP,
  type FlattenedPageNode,
  type ProjectedDrop,
} from "@/lib/sidebarPageTree";
import type { PageTreeNode } from "@/store/pageStore";

interface UseSidebarDragOptions {
  workspaceId: string;
  visiblePageTreeItems: FlattenedPageNode[];
  pageTreeMap: Map<string, PageTreeNode>;
  onMenuClose: () => void;
  onCreateMenuClose: () => void;
  onExpandParent: (parentId: string) => void;
}

export function useSidebarDrag({
  visiblePageTreeItems,
  pageTreeMap,
  onMenuClose,
  onCreateMenuClose,
  onExpandParent,
}: UseSidebarDragOptions) {
  const { updatePage } = usePageStore();

  const [activeDragPageId, setActiveDragPageId] = useState<string | null>(null);
  const [overDragPageId, setOverDragPageId] = useState<string | null>(null);
  const [dragOffsetX, setDragOffsetX] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const projectedDrop: ProjectedDrop | null =
    activeDragPageId && overDragPageId && visiblePageTreeItems.length > 0
      ? getProjectedDropPosition(visiblePageTreeItems, activeDragPageId, overDragPageId, dragOffsetX)
      : null;

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      setActiveDragPageId(String(event.active.id));
      setOverDragPageId(String(event.active.id));
      setDragOffsetX(0);
      onMenuClose();
      onCreateMenuClose();
    },
    [onMenuClose, onCreateMenuClose]
  );

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    setDragOffsetX(event.delta.x);
    if (event.over?.id) setOverDragPageId(String(event.over.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over?.id ? String(event.over.id) : null;
      const projection =
        overId && activeId !== overId
          ? getProjectedDropPosition(visiblePageTreeItems, activeId, overId, dragOffsetX)
          : null;

      setActiveDragPageId(null);
      setOverDragPageId(null);
      setDragOffsetX(0);

      if (!overId || !projection || activeId === overId) return;

      if (projection.parentId) {
        const activeNode = pageTreeMap.get(activeId);
        const descendantIds = new Set(activeNode ? collectDescendantIds(activeNode) : []);
        if (descendantIds.has(projection.parentId)) return;
      }

      const nextSiblingIds = getReorderedSiblingIds(visiblePageTreeItems, activeId, overId, projection);
      if (nextSiblingIds.length === 0) {
        await updatePage(activeId, { parentId: projection.parentId, order: 0 });
        return;
      }

      await Promise.all(
        nextSiblingIds.map((pageId, index) =>
          updatePage(pageId, { parentId: projection.parentId, order: index * PAGE_ORDER_STEP })
        )
      );

      if (projection.parentId) {
        onExpandParent(projection.parentId);
      }
    },
    [dragOffsetX, pageTreeMap, updatePage, visiblePageTreeItems, onExpandParent]
  );

  const handleDragCancel = useCallback(() => {
    setActiveDragPageId(null);
    setOverDragPageId(null);
    setDragOffsetX(0);
  }, []);

  return {
    sensors,
    activeDragPageId,
    overDragPageId,
    dragOffsetX,
    projectedDrop,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    handleDragCancel,
  };
}
