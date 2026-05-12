"use client";

export type ConnectorHandlePosition = "top" | "right" | "bottom" | "left";

const HANDLES: { position: ConnectorHandlePosition; style: React.CSSProperties }[] = [
  {
    position: "top",
    style: { position: "absolute", left: "50%", top: 0, transform: "translate(-50%, -50%)" },
  },
  {
    position: "right",
    style: { position: "absolute", right: 0, top: "50%", transform: "translate(50%, -50%)" },
  },
  {
    position: "bottom",
    style: { position: "absolute", bottom: 0, left: "50%", transform: "translate(-50%, 50%)" },
  },
  {
    position: "left",
    style: { position: "absolute", left: 0, top: "50%", transform: "translate(-50%, -50%)" },
  },
];

export function ConnectorHandles({
  onPointerDown,
  alwaysVisible,
  isSnapping,
}: {
  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>, position: ConnectorHandlePosition) => void;
  alwaysVisible: boolean;
  isSnapping?: boolean;
}) {
  return (
    <>
      {HANDLES.map(({ position, style }) => (
        <button
          key={position}
          type="button"
          aria-label={`${position} connector handle`}
          className={[
            "absolute z-30 h-3.5 w-3.5 rounded-full border-2 border-white shadow-md transition-all",
            isSnapping
              ? "scale-150 bg-[var(--color-accent)] opacity-100"
              : "bg-[var(--color-accent)]",
            alwaysVisible
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-80 hover:opacity-100",
          ].join(" ")}
          style={style}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
            onPointerDown(event, position);
          }}
        />
      ))}
    </>
  );
}
