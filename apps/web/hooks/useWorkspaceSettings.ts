"use client";

import { useEffect, useMemo, useState } from "react";
import { profileImagePresets } from "@/lib/profileImagePresets";
import { applyTheme, getResolvedTheme, type ObnofiTheme } from "@/lib/theme";
import type { ProfileResponse, WorkspaceSettingsResponse } from "@/components/workspace/SettingsShared";

export type { ProfileResponse, WorkspaceSettingsResponse };

export function useWorkspaceSettings(isOpen: boolean, workspaceId: string, onClose: () => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [workspaceSettings, setWorkspaceSettings] = useState<WorkspaceSettingsResponse | null>(null);
  const [draftName, setDraftName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState<ObnofiTheme>("light");

  const themeLabel = useMemo(() => theme, [theme]);
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const shouldShowSkeleton =
    isOpen && (isLoading || profile === null || workspaceSettings === null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    setTheme(getResolvedTheme());

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadSettings = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setProfile(null);
      setWorkspaceSettings(null);

      try {
        const [profileResponse, workspaceResponse] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch(`/api/workspaces/${workspaceId}/settings`, { cache: "no-store" }),
        ]);

        const profileData = (await profileResponse.json()) as ProfileResponse | { error?: string };
        const workspaceData = (await workspaceResponse.json()) as
          | WorkspaceSettingsResponse
          | { error?: string };

        if (!profileResponse.ok || !("email" in profileData)) {
          throw new Error(
            ("error" in profileData && profileData.error) || "계정 설정을 불러오지 못했습니다."
          );
        }

        if (!workspaceResponse.ok || !("workspace" in workspaceData)) {
          throw new Error(
            ("error" in workspaceData && workspaceData.error) ||
              "워크스페이스 설정을 불러오지 못했습니다."
          );
        }

        if (cancelled) return;

        setProfile(profileData);
        setDraftName(profileData.name ?? "");
        setSelectedImage(
          profileData.image && profileImagePresets.includes(profileData.image)
            ? profileData.image
            : profileImagePresets[0]
        );
        setWorkspaceSettings(workspaceData);
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : "설정 정보를 불러오지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadSettings();
    return () => { cancelled = true; };
  }, [isOpen, workspaceId]);

  const trimmedName = draftName.trim();
  const canSaveProfile =
    !!profile &&
    !!trimmedName &&
    !isSavingProfile &&
    (trimmedName !== (profile.name ?? "") || selectedImage !== profile.image);

  const connectedAccounts = profile?.connectedAccounts ?? [];
  const defaultVisibilityLabel =
    workspaceSettings?.workspace.settings.defaultPageVisibility === "public_link"
      ? "링크 있으면 누구나"
      : workspaceSettings?.workspace.settings.defaultPageVisibility === "private"
        ? "비공개"
        : "워크스페이스 내";

  const handleSaveProfile = async () => {
    if (!profile || !trimmedName) return;

    setIsSavingProfile(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName, image: selectedImage }),
      });

      const data = (await response.json()) as ProfileResponse | { error?: string };
      if (!response.ok || !("email" in data)) {
        throw new Error(("error" in data && data.error) || "프로필을 저장하지 못했습니다.");
      }

      setProfile(data);
      setDraftName(data.name ?? "");
      setSelectedImage(
        data.image && profileImagePresets.includes(data.image)
          ? data.image
          : profileImagePresets[0]
      );
      setSuccessMessage("프로필을 저장했습니다.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "프로필을 저장하지 못했습니다."
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleThemeChange = (nextTheme: ObnofiTheme) => {
    applyTheme(nextTheme);
    setTheme(nextTheme);
  };

  return {
    isLoading,
    profile,
    workspaceSettings,
    draftName,
    setDraftName,
    selectedImage,
    setSelectedImage,
    isSavingProfile,
    errorMessage,
    successMessage,
    theme,
    themeLabel,
    locale,
    timeZone,
    shouldShowSkeleton,
    trimmedName,
    canSaveProfile,
    connectedAccounts,
    defaultVisibilityLabel,
    handleSaveProfile,
    handleThemeChange,
  };
}
