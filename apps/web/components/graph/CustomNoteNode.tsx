"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useRouter } from "next/navigation";
import { Database } from "lucide-react";
import { type GraphNode, type GraphDatabaseNode } from "@/lib/graph-utils";

function useGraphNode(path: string, animationIndex: number) {
  const router = useRouter();
  const [appearing, setAppearing] = useState(true);

  const handleOpen = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    router.push(path);
  }, [router, path]);

  const onAnimationEnd = useCallback(() => setAppearing(false), []);

  const animationStyle = useMemo(() => (appearing ? {
    animation: `graphNodeAppear 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both`,
    animationDelay: `${Math.min(animationIndex * 35, 600)}ms`,
  } : undefined), [appearing, animationIndex]);

  return { appearing, handleOpen, onAnimationEnd, animationStyle };
}

export const CustomNoteNode = memo(function CustomNoteNode({
  data,
  selected,
}: NodeProps<GraphNode>) {
  const { handleOpen, onAnimationEnd, animationStyle } = useGraphNode(data.path, data.animationIndex);

  const style = useMemo(() => ({
    borderColor: selected ? "#2E7D45" : "rgba(148, 163, 184, 0.6)",
    backgroundColor: selected ? "#2E7D45" : "rgba(100, 116, 139, 0.75)",
    boxShadow: selected ? "0 0 0 6px rgba(46,125,69,0.16)" : undefined,
    ...animationStyle,
  }), [selected, animationStyle]);

  return (
    <div
      onDoubleClick={handleOpen}
      onAnimationEnd={onAnimationEnd}
      className="group relative flex h-8 w-8 cursor-grab items-center justify-center rounded-full border text-center transition-all active:cursor-grabbing"
      style={style}
      title={`${data.title || "Untitled"} 열기`}
    >
      <Handle type="target" position={Position.Left} style={{ top: "50%" }} className="!h-3 !w-3 !border-0 !bg-transparent opacity-0" />
      <Handle type="source" position={Position.Right} style={{ top: "50%" }} className="!h-3 !w-3 !border-0 !bg-transparent opacity-0" />
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

export const CustomDatabaseNode = memo(function CustomDatabaseNode({
  data,
  selected,
}: NodeProps<GraphDatabaseNode>) {
  const { handleOpen, onAnimationEnd, animationStyle } = useGraphNode(data.path, data.animationIndex);

  const style = useMemo(() => ({
    borderColor: selected ? "#337EA9" : "rgba(148, 163, 184, 0.6)",
    backgroundColor: selected ? "#337EA9" : "rgba(100, 116, 139, 0.75)",
    boxShadow: selected ? "0 0 0 6px rgba(51,126,169,0.18)" : undefined,
    ...animationStyle,
  }), [selected, animationStyle]);

  return (
    <div
      onDoubleClick={handleOpen}
      onAnimationEnd={onAnimationEnd}
      className="group relative flex h-8 w-8 cursor-grab items-center justify-center rounded-full border text-center transition-all active:cursor-grabbing"
      style={style}
      title={`${data.title || "Untitled"} 열기`}
    >
      <Handle type="target" position={Position.Left} style={{ top: "50%" }} className="!h-3 !w-3 !border-0 !bg-transparent opacity-0" />
      <Handle type="source" position={Position.Right} style={{ top: "50%" }} className="!h-3 !w-3 !border-0 !bg-transparent opacity-0" />
      <div className="pointer-events-none absolute left-1/2 top-full mt-1.5 -translate-x-1/2">
        <div
          className={[
            "inline-flex max-w-[148px] items-center gap-1 truncate rounded px-1.5 py-0.5 text-[11px] font-medium leading-none transition-colors",
            selected
              ? "bg-[#DDEBF1] text-[#337EA9] dark:bg-[#1F3442] dark:text-[#7FC0E6]"
              : "text-zinc-600 group-hover:bg-white/80 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-900/80 dark:group-hover:text-zinc-100",
          ].join(" ")}
        >
          <Database className="h-3 w-3 shrink-0" style={{ color: "#FFFFFF" }} />
          {data.title || "Untitled"}
        </div>
      </div>
    </div>
  );
});
