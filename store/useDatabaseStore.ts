"use client";

import { create } from "zustand";

type ViewMode = "table";

interface DatabaseStoreState {
  viewMode: ViewMode;
  searchQuery: string;
  setViewMode: (viewMode: ViewMode) => void;
  setSearchQuery: (searchQuery: string) => void;
}

export const useDatabaseStore = create<DatabaseStoreState>((set) => ({
  viewMode: "table",
  searchQuery: "",
  setViewMode: (viewMode) => set({ viewMode }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
}));
