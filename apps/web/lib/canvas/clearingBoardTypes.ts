import type { Comment, Element, Room } from "@obnofi/types/clearing";

export type DragState = {
  elementId: string;
  pointerId: number;
  offsetX: number;
  offsetY: number;
  groupOrigin: Record<string, { x: number; y: number }>;
  sectionChildOrigins?: Record<string, { x: number; y: number }>;
  preDragSnapshot: Element[];
} | null;

export type PanState = {
  pointerId: number;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null;

export type DrawState = {
  elementId: string;
  startX: number;
  startY: number;
  isDraftConnector?: boolean;
  connectorHasArrow?: boolean;
  connectorLineStyle?: string;
  fromElementId?: string;
} | null;

export type LassoState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
} | null;

export type LocalClearingSnapshot = {
  room: Room;
  elements: Element[];
  comments: Comment[];
};

export type ClearingSaveStatus = "saved" | "saving" | "unsaved" | "error";

export type ClearingElementBroadcast =
  | {
      kind: "upsert";
      originId: string;
      element: Element;
    }
  | {
      kind: "delete";
      originId: string;
      elementId: string;
    };

export type ClearingBootstrapState = {
  room: Room;
  elements: Element[];
  comments: Comment[];
  isSupabaseLive: boolean;
};
