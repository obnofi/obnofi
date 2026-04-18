"use client";

import { create } from "zustand";

interface DatabaseModalState {
  isOpen: boolean;
  databaseId: string | null;
  pageTitle: string | null;
}

interface UIStoreState {
  // Database View Modal
  databaseModal: DatabaseModalState;
  openDatabaseModal: (databaseId: string, pageTitle?: string) => void;
  closeDatabaseModal: () => void;
}

export const useUIStore = create<UIStoreState>((set) => ({
  // Database View Modal
  databaseModal: {
    isOpen: false,
    databaseId: null,
    pageTitle: null,
  },

  openDatabaseModal: (databaseId: string, pageTitle?: string) =>
    set({
      databaseModal: {
        isOpen: true,
        databaseId,
        pageTitle: pageTitle || null,
      },
    }),

  closeDatabaseModal: () =>
    set({
      databaseModal: {
        isOpen: false,
        databaseId: null,
        pageTitle: null,
      },
    }),
}));
