"use client";

import { ChevronDown, ChevronLeft } from "lucide-react";
import { WorkspaceGlyph } from "@/components/workspace/WorkspaceGlyph";
import type { WorkspaceOption } from "@/lib/sidebarPageTree";

interface SidebarWorkspaceSwitcherProps {
  workspaceId: string;
  currentWorkspace: WorkspaceOption | null;
  currentWorkspaceOwnerImage: string | null;
  workspaces: WorkspaceOption[];
  isWorkspaceMenuOpen: boolean;
  onToggleMenu: () => void;
  onSelectWorkspace: (id: string) => void;
  onHideSidebar: () => void;
  workspaceMenuRef: React.RefObject<HTMLDivElement>;
}

export function SidebarWorkspaceSwitcher({
  workspaceId,
  currentWorkspace,
  currentWorkspaceOwnerImage,
  workspaces,
  isWorkspaceMenuOpen,
  onToggleMenu,
  onSelectWorkspace,
  onHideSidebar,
  workspaceMenuRef,
}: SidebarWorkspaceSwitcherProps) {
  return (
    <div className="relative px-2 py-2" ref={workspaceMenuRef}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleMenu}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1.5 text-left hover:bg-[var(--color-hover)]"
        >
          <WorkspaceGlyph
            icon={currentWorkspace?.icon ?? null}
            image={currentWorkspaceOwnerImage}
            label={currentWorkspace?.name ?? "Workspace"}
          />
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium text-[var(--color-text-primary)]">
              {currentWorkspace?.name ?? "Workspace"}
            </span>
            <span className="block truncate text-[11px] text-[var(--color-text-secondary)]">
              {currentWorkspace ? currentWorkspace.role.toLowerCase() : "loading"}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform ${
              isWorkspaceMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        <button
          type="button"
          onClick={onHideSidebar}
          className="shrink-0 rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
          aria-label="사이드바 숨기기"
          title="사이드바 숨기기"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {isWorkspaceMenuOpen && (
        <div className="absolute left-2 right-2 top-full z-[99999] mt-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
          {workspaces.map((workspace) => {
            const isActiveWorkspace = workspace.id === workspaceId;
            return (
              <button
                key={workspace.id}
                type="button"
                onClick={() => onSelectWorkspace(workspace.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] ${
                  isActiveWorkspace
                    ? "bg-[var(--color-hover)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
                }`}
              >
                <WorkspaceGlyph
                  icon={workspace.icon}
                  image={workspace.ownerImage}
                  label={workspace.name}
                />
                <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                {isActiveWorkspace ? (
                  <span className="text-[11px] font-medium text-[var(--color-accent)]">
                    현재
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
