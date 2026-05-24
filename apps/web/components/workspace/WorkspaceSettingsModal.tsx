"use client";

import { useState } from "react";
import { User, Users, X } from "lucide-react";
import { useWorkspaceSettings } from "@/hooks/useWorkspaceSettings";
import { AccountSettingsSkeleton, WorkspaceSettingsSkeleton } from "./SettingsSkeletons";
import { AccountSettingsTab } from "./AccountSettingsTab";
import { WorkspaceSettingsTab } from "./WorkspaceSettingsTab";
import type { SettingsTab } from "./SettingsShared";

export function WorkspaceSettingsModal({
  isOpen,
  onClose,
  workspaceId,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
}) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  const {
    profile,
    workspaceSettings,
    draftName,
    setDraftName,
    selectedImage,
    setSelectedImage,
    isSavingProfile,
    canSaveProfile,
    errorMessage,
    successMessage,
    trimmedName,
    connectedAccounts,
    themeLabel,
    locale,
    timeZone,
    shouldShowSkeleton,
    defaultVisibilityLabel,
    handleSaveProfile,
    handleThemeChange,
  } = useWorkspaceSettings(isOpen, workspaceId, onClose);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative flex h-[88vh] w-full max-w-6xl overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl">
        {/* Sidebar Nav */}
        <aside className="flex w-[260px] shrink-0 flex-col bg-[var(--color-surface)] p-4">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-placeholder)]">
                Settings
              </div>
              <h2 className="mt-1 text-xl font-semibold text-[var(--color-text-primary)]">
                Workspace Control
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("account")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                activeTab === "account"
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              }`}
            >
              <User className="h-4 w-4" />
              계정 설정
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("workspace")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm ${
                activeTab === "workspace"
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]"
              }`}
            >
              <Users className="h-4 w-4" />
              워크스페이스 설정
            </button>
          </div>

          <div className="mt-6 rounded-lg bg-[var(--color-background)] p-3 text-xs text-[var(--color-text-secondary)]">
            저장 가능한 항목은 현재 프로필만 연결되어 있습니다. 나머지 항목은 모달 안에서 구조를 먼저 정리해 둔 상태입니다.
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {shouldShowSkeleton ? (
            activeTab === "account" ? <AccountSettingsSkeleton /> : <WorkspaceSettingsSkeleton />
          ) : errorMessage && !profile && !workspaceSettings ? (
            <div className="rounded-xl bg-[var(--color-surface)] p-6 text-sm text-[var(--color-text-secondary)]">
              {errorMessage}
            </div>
          ) : activeTab === "account" && profile ? (
            <AccountSettingsTab
              profile={profile}
              draftName={draftName}
              setDraftName={setDraftName}
              selectedImage={selectedImage}
              setSelectedImage={setSelectedImage}
              isSavingProfile={isSavingProfile}
              canSaveProfile={canSaveProfile}
              errorMessage={errorMessage}
              successMessage={successMessage}
              trimmedName={trimmedName}
              connectedAccounts={connectedAccounts}
              themeLabel={themeLabel}
              locale={locale}
              timeZone={timeZone}
              onSaveProfile={() => void handleSaveProfile()}
              onThemeChange={handleThemeChange}
            />
          ) : workspaceSettings ? (
            <WorkspaceSettingsTab
              workspaceSettings={workspaceSettings}
              defaultVisibilityLabel={defaultVisibilityLabel}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}
