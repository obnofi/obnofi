"use client";

import { useState } from "react";
import {
  ImageIcon,
  Hand,
  Layers3,
  LayoutTemplate,
  MessageSquarePlus,
  MousePointer2,
  Plus,
  RefreshCw,
  StickyNote,
  Type,
  Highlighter,
  PenTool as PenToolIcon,
  Waypoints,
  Crosshair,
} from "lucide-react";
import type { CanvasTool, LineStyle } from "@/store/useCanvasStore";
import type { Element } from "@obnofi/types/clearing";
import { SHAPE_OPTIONS, LINK_OPTIONS, type ShapeTool } from "@/lib/editor/clearingToolbarConstants";
import {
  toolButtonClass,
  iconButtonClass,
  ClearingTemplateMenu,
  Divider,
  PenDropdown,
  ShapeDropdown,
  LinkDropdown,
  EmojiStampGroup,
  UndoRedoGroup,
} from "./ClearingToolbarParts";
import { ToolbarHoverLabel } from "./ToolbarHoverLabel";
import type { ClearingTemplateId } from "@/lib/canvas/clearingTemplates";

export function ClearingToolbar({
  activeTool,
  canRedo,
  canUndo,
  compact = false,
  isUploadingImage,
  lineStyle,
  onAddComment,
  onAddElement,
  onApplyTemplate,
  onDrawingColorChange,
  onEmojiStampSelect,
  onLineStyleChange,
  onOpenImagePicker,
  onRedo,
  onResetViewport,
  onSetTool,
  onStrokeWidthChange,
  onUndo,
  strokeColor,
  strokeWidth,
}: {
  activeTool: CanvasTool;
  canRedo: boolean;
  canUndo: boolean;
  compact?: boolean;
  isUploadingImage: boolean;
  lineStyle: LineStyle;
  onAddComment: () => void;
  onAddElement: (kind: Extract<Element["type"], "sticky" | "connector" | "vine">) => void;
  onApplyTemplate: (templateId: ClearingTemplateId) => void;
  onDrawingColorChange: (color: string) => void;
  onEmojiStampSelect: (emoji: string) => void;
  onLineStyleChange: (style: LineStyle) => void;
  onOpenImagePicker: () => void;
  onRedo: () => void;
  onResetViewport: () => void;
  onSetTool: (tool: CanvasTool) => void;
  onStrokeWidthChange: (strokeWidth: number) => void;
  onUndo: () => void;
  strokeColor: string;
  strokeWidth: number;
}) {
  const [lastShapeTool, setLastShapeTool] = useState<ShapeTool>("shape-rectangle");
  const [shapeDropdownOpen, setShapeDropdownOpen] = useState(false);
  const [linkDropdownOpen, setLinkDropdownOpen] = useState(false);
  const [penDropdownOpen, setPenDropdownOpen] = useState(false);
  const [templateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [activeTemplateId, setActiveTemplateId] = useState<ClearingTemplateId | null>(null);

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

  const handleLinkButtonClick = () => {
    if (isLinkActive) {
      setLinkDropdownOpen((prev) => !prev);
    } else {
      onSetTool("connector");
      setLinkDropdownOpen(false);
    }
  };

  const handlePenButtonClick = () => {
    if (activeTool !== "pen" && activeTool !== "marker") {
      onSetTool("pen");
    }
    setPenDropdownOpen((prev) => !prev);
  };

  return (
    <div className="pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-1 overflow-visible rounded-[18px] border border-[var(--color-border)] bg-[var(--color-background)]/94 px-2 py-2 shadow-[0_14px_40px_rgba(15,23,42,0.14)] backdrop-blur-xl">
      <div className="flex items-center gap-1">
        <ToolbarHoverLabel label="Select">
          <button
            className={toolButtonClass(activeTool === "select")}
            onClick={() => onSetTool("select")}
            title="Select"
            type="button"
          >
            <MousePointer2 className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>

        <ToolbarHoverLabel label="Pan">
          <button
            className={toolButtonClass(activeTool === "pan")}
            onClick={() => onSetTool("pan")}
            title="Pan"
            type="button"
          >
            <Hand className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>

        {/* Pen/Marker picker */}
        <ToolbarHoverLabel label={activeTool === "marker" ? "Marker" : "Pen"}>
          <div className="relative">
            <button
              className={`${toolButtonClass(activeTool === "pen" || activeTool === "marker")} pr-1`}
              title={activeTool === "marker" ? "Marker" : "Pen"}
              type="button"
              onClick={handlePenButtonClick}
            >
              {activeTool === "marker" ? (
                <Highlighter className="h-4 w-4" />
              ) : (
                <PenToolIcon className="h-4 w-4" />
              )}
              <svg className="ml-0.5 h-2.5 w-2.5 opacity-50" viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0l5 6 5-6z" />
              </svg>
            </button>

            {penDropdownOpen && (
              <PenDropdown
                activeTool={activeTool}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                onSetTool={onSetTool}
                onColorSelect={onDrawingColorChange}
                onStrokeWidthSelect={onStrokeWidthChange}
                onClose={() => setPenDropdownOpen(false)}
              />
            )}
          </div>
        </ToolbarHoverLabel>
      </div>

      <Divider />

      <div className="flex items-center gap-1">
        <ToolbarHoverLabel label="Sticky">
          <button
            className={iconButtonClass()}
            onClick={() => onAddElement("sticky")}
            title="Sticky"
            type="button"
          >
            <StickyNote className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>

        {/* Shape picker */}
        <ToolbarHoverLabel label={activeShapeOption.label}>
          <div className="relative">
            <button
              className={`${toolButtonClass(isShapeActive)} pr-1`}
              title={activeShapeOption.label}
              type="button"
              onClick={handleShapeButtonClick}
            >
              <ShapeIcon className="h-4 w-4" />
              <svg className="ml-0.5 h-2.5 w-2.5 opacity-50" viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0l5 6 5-6z" />
              </svg>
            </button>

            {shapeDropdownOpen && (
              <ShapeDropdown
                activeTool={activeTool}
                onSelect={(tool) => {
                  setLastShapeTool(tool);
                  onSetTool(tool);
                  setShapeDropdownOpen(false);
                }}
                onClose={() => setShapeDropdownOpen(false)}
              />
            )}
          </div>
        </ToolbarHoverLabel>

        <ToolbarHoverLabel label="Mind map">
          <button
            className={toolButtonClass(activeTool === "vine")}
            onClick={() => onSetTool("vine")}
            title="Mind map"
            type="button"
          >
            <Waypoints className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>

        {/* Firefly — 레이저 포인터 (R 누른 채 흔들거나 클릭) */}
        <ToolbarHoverLabel label="Laser pointer">
          <button
            className={toolButtonClass(activeTool === "laser")}
            onClick={() => onSetTool("laser")}
            title="Laser pointer (hold R + shake)"
            type="button"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>

        <ToolbarHoverLabel label="Text">
          <button
            className={toolButtonClass(activeTool === "text")}
            onClick={() => onSetTool("text")}
            title="Text"
            type="button"
          >
            <Type className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>

        <ToolbarHoverLabel label="Section">
          <button
            className={toolButtonClass(activeTool === "section")}
            onClick={() => onSetTool("section")}
            title="Section"
            type="button"
          >
            <Layers3 className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>

        {/* Link/Connector picker */}
        <ToolbarHoverLabel label={activeLinkOption.label}>
          <div className="relative">
            <button
              className={`${toolButtonClass(isLinkActive)} pr-1`}
              title={activeLinkOption.label}
              type="button"
              onClick={handleLinkButtonClick}
            >
              <LinkIcon className="h-4 w-4" />
              <svg className="ml-0.5 h-2.5 w-2.5 opacity-50" viewBox="0 0 10 6" fill="currentColor">
                <path d="M0 0l5 6 5-6z" />
              </svg>
            </button>

            {linkDropdownOpen && (
              <LinkDropdown
                lineStyle={lineStyle}
                isLinkActive={isLinkActive}
                onSelect={(style) => {
                  onLineStyleChange(style);
                  onSetTool("connector");
                  setLinkDropdownOpen(false);
                }}
                onClose={() => setLinkDropdownOpen(false)}
              />
            )}
          </div>
        </ToolbarHoverLabel>
      </div>

      <Divider />

      {!compact ? <Divider /> : null}

      <div className="flex items-center gap-1">
        <ToolbarHoverLabel label="Image">
          <button
            className={iconButtonClass()}
            onClick={onOpenImagePicker}
            title={isUploadingImage ? "Uploading image" : "Image"}
            type="button"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>
        <ToolbarHoverLabel label="Comment">
          <button
            className={toolButtonClass(activeTool === "comment")}
            onClick={onAddComment}
            title="Comment"
            type="button"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>
        {!compact ? (
          <ToolbarHoverLabel label="Templates">
            <div className="relative">
              <button
                className={iconButtonClass()}
                onClick={() => setTemplateDropdownOpen((open) => !open)}
                title="Templates"
                type="button"
              >
                <LayoutTemplate className="h-4 w-4" />
              </button>
              {templateDropdownOpen ? (
                <ClearingTemplateMenu
                  activeTemplateId={activeTemplateId}
                  onApplyTemplate={(templateId) => {
                    setActiveTemplateId(templateId);
                    onApplyTemplate(templateId);
                  }}
                  onClose={() => setTemplateDropdownOpen(false)}
                />
              ) : null}
            </div>
          </ToolbarHoverLabel>
        ) : null}
      </div>

      {!compact ? <Divider /> : null}

      {!compact ? <EmojiStampGroup onEmojiStampSelect={onEmojiStampSelect} /> : null}

      <Divider />

      <UndoRedoGroup
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={onUndo}
        onRedo={onRedo}
      />

      <Divider />

      <ToolbarHoverLabel label="Reset viewport">
        <button
          className={iconButtonClass()}
          onClick={onResetViewport}
          title="Reset viewport"
          type="button"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </ToolbarHoverLabel>

      {!compact ? (
        <ToolbarHoverLabel label="Add">
          <button
            className={iconButtonClass()}
            onClick={() => setTemplateDropdownOpen((open) => !open)}
            title="Add"
            type="button"
          >
            <Plus className="h-4 w-4" />
          </button>
        </ToolbarHoverLabel>
      ) : null}
    </div>
  );
}
