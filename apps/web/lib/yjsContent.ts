import * as Y from "yjs";
import { yDocToProsemirrorJSON } from "y-prosemirror";

export function resolvePersistedYjsContent(
  state: Uint8Array | Buffer | null | undefined
): object | null {
  if (!state) {
    return null;
  }

  try {
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, new Uint8Array(state));
    return yDocToProsemirrorJSON(ydoc) as object;
  } catch {
    return null;
  }
}
