import { useEffect } from "react";

export type ClearingKeyboardOptions = {
  selectedIds: string[];
  clearSelection: () => void;
  setSelectedElement: (id: string | null) => void;
  pushHistory: (snapshot?: import("@obnofi/types/clearing").Element[]) => void;
  removeElement: (id: string) => void;
  undo: () => void;
  redo: () => void;
  setEmbedDraftUrl: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useClearingKeyboard({
  selectedIds,
  clearSelection,
  setSelectedElement,
  pushHistory,
  removeElement,
  undo,
  redo,
  setEmbedDraftUrl,
}: ClearingKeyboardOptions) {
  // Delete / Backspace — remove selected elements
  useEffect(() => {
    const handleDelete = (event: KeyboardEvent) => {
      if (event.key !== "Delete" && event.key !== "Backspace") return;

      const active = document.activeElement as HTMLElement | null;
      if (
        active?.getAttribute("contenteditable") === "true" ||
        active?.tagName === "INPUT" ||
        active?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (selectedIds.length === 0) return;

      pushHistory();
      selectedIds.forEach((id) => removeElement(id));
      clearSelection();
      setSelectedElement(null);
    };

    window.addEventListener("keydown", handleDelete);
    return () => window.removeEventListener("keydown", handleDelete);
  }, [clearSelection, pushHistory, removeElement, selectedIds, setSelectedElement]);

  // Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z — undo / redo
  useEffect(() => {
    const handleUndoRedo = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return;
      const active = document.activeElement as HTMLElement | null;
      if (active?.closest("input, textarea, [contenteditable='true']")) return;

      if (event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        undo();
      } else if ((event.key === "z" && event.shiftKey) || event.key === "y") {
        event.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleUndoRedo);
    return () => window.removeEventListener("keydown", handleUndoRedo);
  }, [undo, redo]);

  // Paste URL — open embed modal
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;

      const text = event.clipboardData?.getData("text/plain")?.trim();
      if (!text) return;

      try {
        new URL(text);
      } catch {
        return;
      }

      event.preventDefault();
      setEmbedDraftUrl(text);
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [setEmbedDraftUrl]);
}
