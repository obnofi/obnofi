"use client";

import { create } from "zustand";
import type { ViewType } from "@/types/database";

interface DatabaseViewState {
  activeView: ViewType;
  setView: (view: ViewType) => void;
}

export const useDatabaseViewStore = create<DatabaseViewState>((set) => ({
  activeView: "table",
  setView: (view) => set({ activeView: view }),
}));
