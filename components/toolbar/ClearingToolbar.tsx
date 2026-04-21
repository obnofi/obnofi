"use client";

import { useState } from "react";
import {
  Circle,
  Diamond,
  Highlighter,
  ImageIcon,
  Layers3,
  MessageSquarePlus,
  Minus,
  MousePointer2,
  MoveRight,
  PenTool as PenToolIcon,
  RectangleHorizontal,
  RefreshCw,
  StickyNote,
  Triangle,
  Type,
  Waypoints,
} from "lucide-react";
import type { CanvasTool, LineStyle } from "@/store/useCanvasStore";
import type { Element } from "@/types/clearing";

type ShapeTool = Extract<CanvasTool, "shape-rectangle" | "shape-ellipse" | "shape-diamond" | "shape-triangle">;

const SHAPE_OPTIONS: { tool: ShapeTool; label: string; Icon: React.ElementType }[] = [
  { tool: "shape-rectangle", label: "Rectangle", Icon: RectangleHorizontal },
  { tool: "shape-ellipse",   label: "Ellipse",   Icon: Circle },
  { tool: "shape-diamond",   label: "Diamond",   Icon: Diamond },
  { tool: "shape-triangle",  label: "Triangle",  Icon: Triangle },
];

type LinkOption = { style: LineStyle; label: string; Icon: React.ElementType };

const LINK_OPTIONS: LinkOption[] = [
  { style: "arrow", label: "Arrow", Icon: MoveRight },
  { style: "solid", label: "Solid line", Icon: Minus },
  { style: "dashed", label: "Dashed line", Icon: () => (
    <svg className="h-4 w-4" viewBox="0 0 16 4">
      <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
    </svg>
  )},
  { style: "dotted", label: "Dotted line", Icon: () => (
    <svg className="h-4 w-4" viewBox="0 0 16 4">
      <line x1="0" y1="2" x2="16" y2="2" stroke="currentColor" strokeWidth="2" strokeDasharray="2 2" />
    </svg>
  )},
];

const EMOJIS = ["👍", "❤️", "😂", "🔥", "💡", "⚡"] as const;

function toolButtonClass(isActive: boolean) {
  return `flex h-11 w-11 items-center justify-center rounded-2xl border text-[var(--color-text-primary)] transition ${
    isActive
      ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] shadow-[inset_0_0_0_1px_var(--color-accent)]"
      : "border-transparent bg-transparent hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
  }`;
}

function iconButtonClass() {
  return "flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-[var(--color-text-primary)] transition hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]";
}

function Divider() {
  return <div className="h-8 w-px bg-[var(--color-border)]" />;
}

export function ClearingToolbar({
  activeTool,
  compact = false,
  isUploadingImage,
  lineStyle,
  onAddComment,
  onAddElement,
  onDrawingColorChange,
  onEmojiStampSelect,
  onLineStyleChange,
  onOpenImagePicker,
  onResetViewport,
  onSetTool,
  onStrokeWidthChange,
  strokeColor,
  strokeWidth,
}: {
  activeTool: CanvasTool;
  compact?: boolean;
  isUploadingImage: boolean;
  lineStyle: LineStyle;
  onAddComment: () => void;
  onAddElement: (kind: Extract<Element["type"], "sticky" | "connector">) => void;
  onDrawingColorChange: (color: string) => void;
  onEmojiStampSelect: (emoji: string) => void;
  onLineStyleChange: (style: LineStyle) => void;
  onOpenImagePicker: () => void;
  onResetViewport: () => void;
  onSetTool: (tool: CanvasTool) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  strokeColor: string;
  strokeWidth: number;
}) {
  const [lastShapeTool, setLastShapeTool] = useState<ShapeTool>("shape-rectangle");
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const [linkDropdownOpen, setLinkDropdownOpen] = useState(false);

  const isShapeActive = (activeTool as string).startsWith("shape-");
  const activeShapeOption = SHAPE_OPTIONS.find((o) => o.tool === lastShapeTool) ?? SHAPE_OPTIONS[0];
  const ShapeIcon = activeShapeOption.Icon;

  const isLinkActive = activeTool === "connector";
  const activeLinkOption = LINK_OPTIONS.find((o) => o.style === lineStyle) ?? LINK_OPTIONS[0];
  const LinkIcon = activeLinkOption.Icon;

  const handleShapeButtonClick = () => {
    if (isShapeActive && activeTool === lastShapeTool) {
      setShapeDropdownOpen((prev) => !prev);
    } else {
      onSetTool(lastShapeTool);
      setShapeDropdownOpen(false);
    }
  };

  const handleShapeOptionSelect = (tool: ShapeTool) => {
    setLastShapeTool(tool);
    onSetTool(tool);
    setShapeDropdownOpen(false);
  };

  const handleLinkButtonClick = () => {
    if (isLinkActive) {
      setLinkDropdownOpen((prev) => !prev);
    } else {
      onSetTool("connector");
      setLinkDropdownOpen(false);
    }
  };

  const handleLinkOptionSelect = (style: LineStyle) => {
    onLineStyleChange(style);
    onSetTool("connector");
    setLinkDropdownOpen(false);
  };

  return (
    <div className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-2 overflow-visible rounded-[26px] border border-[var(--color-border)] bg-[var(--color-surface)]/92 px-3 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.14)] backdrop-blur-xl">
      <div className="flex items-center gap-1">
        <button
          className={toolButtonClass(activeTool === "select")}
          onClick={() => onSetTool("select")}
          title="Select"
          type="button"
        >
          <MousePointer2 className="h-4 w-4" />
        </button>
        <button
          className={toolButtonClass(activeTool === "pan")}
          onClick={() => onSetTool("pan")}
          title="Pan"
          type="button"
        >
          <PenToolIcon className="h-4 w-4" />
        </button>
      </div>

      <Divider />

      <div className="flex items-center gap-1">
        <button
          className={iconButtonClass()}
          onClick={() => onAddElement("sticky")}
          title="Sticky"
          type="button"
        >
          <StickyNote className="h-4 w-4" />
        </button>

        {/* Shape picker */}
        <div className="relative">
          <button
            className={`${toolButtonClass(isShapeActive)} pr-1`}
            title={activeShapeOption.label}
            type="button"
            onClick={handleShapeButtonClick}
          >
            <ShapeIcon className="h-4 w-4" />
            <svg
              className="ml-0.5 h-2.5 w-2.5 opacity-50"
              viewBox="0 0 10 6"
              fill="currentColor"
            >
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {shapeDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[998]"
                onClick={() => setShapeDropdownOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-[999] mb-2 min-w-40 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                {SHAPE_OPTIONS.map(({ tool, label, Icon }) => (
                  <button
                    key={tool}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                      activeTool === tool
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                    }`}
                    type="button"
                    onClick={() => handleShapeOptionSelect(tool)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button
          className={toolButtonClass(activeTool === "text")}
          onClick={() => onSetTool("text")}
          title="Text"
          type="button"
        >
          <Type className="h-4 w-4" />
        </button>

        <button
          className={toolButtonClass(activeTool === "section")}
          onClick={() => onSetTool("section")}
          title="Section"
          type="button"
        >
          <Layers3 className="h-4 w-4" />
        </button>

        {/* Link/Connector picker */}
        <div className="relative">
          <button
            className={`${toolButtonClass(isLinkActive)} pr-1`}
            title={activeLinkOption.label}
            type="button"
            onClick={handleLinkButtonClick}
          >
            <LinkIcon className="h-4 w-4" />
            <svg
              className="ml-0.5 h-2.5 w-2.5 opacity-50"
              viewBox="0 0 10 6"
              fill="currentColor"
            >
              <path d="M0 0l5 6 5-6z" />
            </svg>
          </button>

          {linkDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-[998]"
                onClick={() => setLinkDropdownOpen(false)}
              />
              <div className="absolute bottom-full left-0 z-[999] mb-2 min-w-44 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
                {LINK_OPTIONS.map(({ style, label, Icon }) => (
                  <button
                    key={style}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition ${
                      lineStyle === style && isLinkActive
                        ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]"
                    }`}
                    type="button"
                    onClick={() => handleLinkOptionSelect(style)}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <Divider />

      {!compact ? (
        <>
          <div className="flex items-center gap-1">
        <button
          className={toolButtonClass(activeTool === "pen")}
          onClick={() => onSetTool("pen")}
          title="Pen"
          type="button"
        >
          <PenToolIcon className="h-4 w-4" />
        </button>
        <button
          className={toolButtonClass(activeTool === "marker")}
          onClick={() => onSetTool("marker")}
          title="Marker"
          type="button"
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <label className="ml-1 flex h-11 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-3">
          <input
            className="h-6 w-6 cursor-pointer rounded-full border-0 bg-transparent p-0"
            onChange={(event) => onDrawingColorChange(event.target.value)}
            title="Ink color"
            type="color"
            value={strokeColor}
          />
          <input
            className="w-20 accent-[var(--color-accent)]"
            max={24}
            min={1}
            onChange={(event) => onStrokeWidthChange(Number(event.target.value))}
            title="Stroke width"
            type="range"
            value={strokeWidth}
          />
        </label>
      </div>

      <Divider />
        </>
      ) : null}

      <div className="flex items-center gap-1">
        <button
          className={iconButtonClass()}
          onClick={onOpenImagePicker}
          title={isUploadingImage ? "Uploading image" : "Image"}
          type="button"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          className={toolButtonClass(activeTool === "comment")}
          onClick={onAddComment}
          title="Comment"
          type="button"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>

      {!compact ? <Divider /> : null}

      {!compact ? (
        <div className="flex items-center gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-transparent text-lg transition hover:border-[var(--color-border)] hover:bg-[var(--color-hover)]"
            onClick={() => onEmojiStampSelect(emoji)}
            title={`Stamp ${emoji}`}
            type="button"
          >
            {emoji}
          </button>
        ))}
      </div>
      ) : null}

      {!compact ? <Divider /> : null}

      <button
        className={iconButtonClass()}
        onClick={onResetViewport}
        title="Reset viewport"
        type="button"
      >
        <RefreshCw className="h-4 w-4" />
      </button>
    </div>
  );
}
