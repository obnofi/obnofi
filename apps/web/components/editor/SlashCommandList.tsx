"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { Editor } from "@tiptap/react";
import { ChevronRight } from "lucide-react";
import type { SlashCommandItem } from "@/components/editor/extensions/SlashCommandExtension";
import {
  buildTree,
  buildFlat,
  type CategorySection,
  type GroupNode,
} from "@/lib/editor/slashCommandListData";
import { useSlashCommandSelect } from "@/lib/editor/slashCommandListUtils";
import { SlashCommandRow, shortcutBadge } from "@/components/editor/SlashCommandRow";

interface SlashCommandListProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
  editor: Editor;
  range: { from: number; to: number };
  query?: string;
  workspaceId?: string;
  pageId?: string;
  onLinkDatabase?: () => void;
  onInsertButton?: () => void;
  onInsertPageLink?: () => void;
}

export function SlashCommandList({
  items,
  editor,
  range,
  query = "",
  workspaceId,
  pageId,
  onLinkDatabase,
  onInsertButton,
  onInsertPageLink,
}: SlashCommandListProps) {
  const isFiltering = query.trim().length > 0;

  const sections: CategorySection[] = useMemo(
    () => (isFiltering ? buildFlat(items) : buildTree(items)),
    [items, isFiltering]
  );

  const rootNodes = useMemo(() => sections.flatMap((s) => s.nodes), [sections]);

  const [rootIndex, setRootIndex] = useState(0);
  const [panel, setPanel] = useState<"root" | "sub">("root");
  const [subIndex, setSubIndex] = useState(0);

  const rootRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const subRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeRoot = rootNodes[rootIndex];
  const activeGroup: GroupNode | null =
    activeRoot?.kind === "group" ? activeRoot : null;

  const handleSelect = useSlashCommandSelect({
    editor,
    range,
    workspaceId,
    pageId,
    onLinkDatabase,
    onInsertButton,
    onInsertPageLink,
  });

  // Reset selection when items list changes
  useEffect(() => {
    setRootIndex(0);
    setPanel("root");
    setSubIndex(0);
  }, [items]);

  // Reset subIndex when active group changes
  useEffect(() => {
    setSubIndex(0);
  }, [activeGroup?.group.id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (panel === "sub" && activeGroup) {
          setSubIndex((prev) =>
            prev <= 0 ? activeGroup.children.length - 1 : prev - 1
          );
        } else {
          setRootIndex((prev) =>
            prev <= 0 ? rootNodes.length - 1 : prev - 1
          );
        }
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (panel === "sub" && activeGroup) {
          setSubIndex((prev) =>
            prev >= activeGroup.children.length - 1 ? 0 : prev + 1
          );
        } else {
          setRootIndex((prev) =>
            prev >= rootNodes.length - 1 ? 0 : prev + 1
          );
        }
        return;
      }
      if (e.key === "ArrowRight") {
        if (panel === "root" && activeGroup) {
          e.preventDefault();
          setPanel("sub");
          setSubIndex(0);
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        if (panel === "sub") {
          e.preventDefault();
          setPanel("root");
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (panel === "sub" && activeGroup) {
          const child = activeGroup.children[subIndex];
          if (child) handleSelect(child);
        } else if (activeRoot?.kind === "leaf") {
          handleSelect(activeRoot.item);
        } else if (activeGroup) {
          setPanel("sub");
          setSubIndex(0);
        }
        return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [rootNodes.length, activeGroup, activeRoot, panel, subIndex, handleSelect]);

  // Scroll selection into view
  useEffect(() => {
    rootRefs.current[rootIndex]?.scrollIntoView({ block: "nearest" });
  }, [rootIndex]);

  useEffect(() => {
    if (panel === "sub") {
      subRefs.current[subIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [subIndex, panel]);

  if (rootNodes.length === 0) return null;

  const panelStyle: React.CSSProperties = {
    background: "var(--color-background)",
    borderColor: "var(--color-border)",
  };

  const sectionLabelStyle: React.CSSProperties = {
    color: "var(--color-text-secondary)",
  };

  return (
    <>
      <style>{`
        .slash-cmd-row:hover:not([data-selected="true"]) {
          background: var(--color-hover);
        }
      `}</style>
      <div className="flex items-start gap-1 z-[100000]">
        {/* Main panel */}
        <div
          className="scrollbar-hidden max-h-[20rem] w-60 overflow-y-auto rounded-md border py-1"
          style={panelStyle}
        >
          {sections.map((section) => (
            <div key={section.id}>
              <div
                className="px-3 pt-2 pb-0.5 text-[10px] font-medium uppercase tracking-wide select-none"
                style={sectionLabelStyle}
              >
                {section.label}
              </div>
              {section.nodes.map((node) => {
                const idx = rootNodes.indexOf(node);
                const isSelected = idx === rootIndex;

                if (node.kind === "group") {
                  return (
                    <SlashCommandRow
                      key={node.group.id}
                      iconName={node.group.icon}
                      title={node.group.title}
                      isSelected={isSelected}
                      isDisabled={false}
                      rightAdornment={
                        <ChevronRight
                          className="flex-shrink-0 w-3 h-3"
                          style={{ color: "var(--color-text-secondary)" }}
                        />
                      }
                      onMouseEnter={() => {
                        setRootIndex(idx);
                        setPanel("root");
                      }}
                      onClick={() => {
                        setRootIndex(idx);
                        setPanel("sub");
                        setSubIndex(0);
                      }}
                      refCallback={(el) => { rootRefs.current[idx] = el; }}
                    />
                  );
                }

                const item = node.item;
                return (
                  <SlashCommandRow
                    key={item.id}
                    iconName={item.icon}
                    title={item.title}
                    isSelected={isSelected}
                    isDisabled={Boolean(item.isDisabled)}
                    rightAdornment={item.shortcut ? shortcutBadge(item.shortcut) : null}
                    onMouseEnter={() => {
                      setRootIndex(idx);
                      setPanel("root");
                    }}
                    onClick={() => handleSelect(item)}
                    refCallback={(el) => { rootRefs.current[idx] = el; }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Submenu panel */}
        {activeGroup && (
          <div
            className="scrollbar-hidden max-h-[20rem] w-56 overflow-y-auto rounded-md border py-1"
            style={panelStyle}
          >
            <div
              className="px-3 pt-2 pb-0.5 text-[10px] font-medium uppercase tracking-wide select-none"
              style={sectionLabelStyle}
            >
              {activeGroup.group.title}
            </div>
            {activeGroup.children.map((child, sIdx) => {
              const isSelected = panel === "sub" && sIdx === subIndex;
              return (
                <SlashCommandRow
                  key={child.id}
                  iconName={child.icon}
                  title={child.title}
                  isSelected={isSelected}
                  isDisabled={Boolean(child.isDisabled)}
                  rightAdornment={child.shortcut ? shortcutBadge(child.shortcut) : null}
                  onMouseEnter={() => {
                    setPanel("sub");
                    setSubIndex(sIdx);
                  }}
                  onClick={() => handleSelect(child)}
                  refCallback={(el) => { subRefs.current[sIdx] = el; }}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
