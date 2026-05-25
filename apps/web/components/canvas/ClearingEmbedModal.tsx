"use client";

type ClearingEmbedModalProps = {
  url: string;
  onUrlChange: (url: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ClearingEmbedModal({
  url,
  onUrlChange,
  onConfirm,
  onCancel,
}: ClearingEmbedModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-lg rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xl">
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">Create embed</p>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          YouTube, Figma, and Google Maps render as embeds. Other URLs become link cards.
        </p>
        <input
          autoFocus
          name="embed-url"
          className="mt-4 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm outline-none"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
        />
        <div className="mt-4 flex justify-end gap-3">
          <button
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm"
            type="button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={onConfirm}
          >
            Place embed
          </button>
        </div>
      </div>
    </div>
  );
}
