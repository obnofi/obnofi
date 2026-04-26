"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { type GraphNode } from "@/lib/graph-utils";

export const CustomNoteNode = memo(function CustomNoteNode({
  data,
  selected,
}: NodeProps<GraphNode>) {
  const router = useRouter();

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    router.push(data.path);
  };

  return (
    <div
      onDoubleClick={handleOpen}
      className="group relative flex h-8 w-8 cursor-grab items-center justify-center rounded-full border text-center transition-all active:cursor-grabbing"
      style={{
        borderColor: selected ? "#2E7D45" : "rgba(148, 163, 184, 0.6)",
        backgroundColor: selected ? "#2E7D45" : "rgba(100, 116, 139, 0.75)",
        boxShadow: selected ? "0 0 0 6px rgba(46,125,69,0.16)" : undefined,
      }}
      title={`${data.title || "Untitled"} 열기`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: "50%" }}
        className="!h-3 !w-3 !border-0 !bg-transparent opacity-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: "50%" }}
        className="!h-3 !w-3 !border-0 !bg-transparent opacity-0"
      />
      <div
        className={[
          "pointer-events-none absolute left-1/2 top-full mt-1.5 max-w-[132px] -translate-x-1/2 truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors",
          selected
            ? "bg-[#E8F5EC] text-[#246138] dark:bg-[#1A3327] dark:text-[#83d29b]"
            : "text-zinc-600 group-hover:bg-white/80 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-900/80 dark:group-hover:text-zinc-100",
        ].join(" ")}
      >
        {data.title || "Untitled"}
      </div>
    </div>
  );
});
