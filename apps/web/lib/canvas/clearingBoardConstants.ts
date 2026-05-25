import type { ClearingBootstrapState } from "./clearingBoardTypes";

export const BOARD_WIDTH = 4000;
export const BOARD_HEIGHT = 2400;

export const PRESENCE_COLOR_MAP: Record<string, string> = {
  ink: "#37352F",
  fern: "#2E7D45",
  mist: "#C7C6C4",
  sun: "#CB912F",
  rose: "#D44C47",
  sky: "#337EA9",
};

export const clearingBootstrapCache = new Map<string, ClearingBootstrapState>();
export const clearingBootstrapRequests = new Map<
  string,
  Promise<ClearingBootstrapState>
>();
