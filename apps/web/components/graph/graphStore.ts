import { create } from "zustand";
import type {
  GraphLinkEdge,
  GraphLinkNode,
} from "@/components/graph/useGraphData";

interface GraphStore {
  nodes: GraphLinkNode[];
  edges: GraphLinkEdge[];
  localDepth: number;
  focusedNoteId: string | null;
  isLocalMode: boolean;
  setGraphData: (nodes: GraphLinkNode[], edges: GraphLinkEdge[]) => void;
  setLocalDepth: (depth: number) => void;
  setFocusedNote: (noteId: string | null) => void;
  setLocalMode: (isLocalMode: boolean) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  nodes: [],
  edges: [],
  localDepth: 2,
  focusedNoteId: null,
  isLocalMode: false,
  setGraphData: (nodes, edges) => set({ nodes, edges }),
  setLocalDepth: (localDepth) => set({ localDepth }),
  setFocusedNote: (focusedNoteId) => set({ focusedNoteId }),
  setLocalMode: (isLocalMode) => set({ isLocalMode }),
}));
