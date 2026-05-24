"use client";

import Image from "next/image";
import { Bell, Globe, KeyRound, Mail, Moon, Sun, Trash2 } from "lucide-react";
import { profileImagePresets } from "@/lib/profileImagePresets";
import type { ObnofiTheme } from "@/lib/theme";
import {
  Section,
  Row,
  DisabledPill,
  ActionButton,
  formatDate,
  type ProfileResponse,
} from "./SettingsShared";

interface AccountSettingsTabProps {
  profile: ProfileResponse;
  draftName: string;
  setDraftName: (name: string) => void;
  selectedImage: string | null;
  setSelectedImage: (image: string | null) => void;
  isSavingProfile: boolean;
  canSaveProfile: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  trimmedName: string;
  connectedAccounts: string[];
  themeLabel: ObnofiTheme;
  locale: string;
  timeZone: string;
  onSaveProfile: () => void;
  onThemeChange: (theme: ObnofiTheme) => void;
}

export function AccountSettingsTab({
  profile,
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
  onSaveProfile,
  onThemeChange,
}: AccountSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">계정 설정</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          프로필과 개인 환경설정을 이곳에서 확인합니다.
        </p>
      </div>

      {errorMessage ? (
        <div className="rounded-lg bg-[var(--color-surface)] px-4 py-3 text-sm text-[#D44C47]">
          {errorMessage}
        </div>
      ) : null}
      {successMessage ? (
        <div className="rounded-lg bg-[var(--color-accent-subtle)] px-4 py-3 text-sm text-[var(--color-accent)]">
          {successMessage}
        </div>
      ) : null}

      <Section
        title="프로필"
        description="이름, 아바타, 이메일을 확인하고 프로필 이름과 아바타를 수정할 수 있습니다."
      >
        <div className="grid gap-6 lg:grid-cols-[120px_minmax(0,1fr)]">
          <div className="flex flex-col items-center gap-3">
            {selectedImage ? (
              <Image
                src={selectedImage}
                alt={trimmedName || profile.name || "Profile"}
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-accent)] text-3xl font-semibold text-white">
                {(trimmedName || profile.name || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-xs text-[var(--color-text-secondary)]">
              {formatDate(profile.createdAt)} 가입
            </div>
          </div>

          <div className="space-y-5">
            <Row label="이름">
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={80}
                className="w-full rounded-md bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-border)] focus:ring-2 focus:ring-[var(--color-accent)]"
                placeholder="이름을 입력하세요"
              />
            </Row>

            <Row label="이메일">
              <div className="flex h-10 items-center rounded-md bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
                {profile.email}
              </div>
            </Row>

            <Row label="아바타 프리셋">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
                {profileImagePresets.map((preset) => {
                  const isActive = selectedImage === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSelectedImage(preset)}
                      className={`rounded-full p-1 transition ${
                        isActive
                          ? "bg-[var(--color-accent-subtle)] ring-2 ring-[var(--color-accent)]"
                          : "hover:bg-[var(--color-hover)]"
                      }`}
                      aria-label="프로필 이미지 선택"
                    >
                      <Image
                        src={preset}
                        alt=""
                        width={44}
                        height={44}
                        className="h-11 w-11 rounded-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            </Row>

            <div className="flex justify-end">
              <ActionButton onClick={onSaveProfile} disabled={!canSaveProfile}>
                {isSavingProfile ? "저장 중..." : "프로필 저장"}
              </ActionButton>
            </div>
          </div>
        </div>
      </Section>

      <Section title="보안" description="비밀번호 변경과 로그인 관련 항목입니다.">
        <Row
          label="비밀번호 변경"
          description="현재 계정은 OAuth 또는 개발용 로그인과 함께 사용됩니다."
        >
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-primary)]">
              <KeyRound className="h-4 w-4 text-[var(--color-text-secondary)]" />
              비밀번호 변경 플로우
            </div>
            <DisabledPill>준비 중</DisabledPill>
          </div>
        </Row>
      </Section>

      <Section title="연동 계정" description="GitHub, Google 등 OAuth 제공자 연결 상태입니다.">
        {["google", "github"].map((provider) => {
          const connected = connectedAccounts.includes(provider);
          return (
            <div
              key={provider}
              className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium capitalize text-[var(--color-text-primary)]">
                  {provider}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {connected ? "현재 연결됨" : "아직 연결되지 않음"}
                </div>
              </div>
              <DisabledPill>{connected ? "연결됨" : "미연결"}</DisabledPill>
            </div>
          );
        })}
      </Section>

      <Section
        title="언어 / 지역"
        description="브라우저에서 감지한 현재 언어와 지역 정보입니다."
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-primary)]">
              <Globe className="h-4 w-4 text-[var(--color-text-secondary)]" />
              인터페이스 언어
            </div>
            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{locale}</div>
          </div>
          <div className="rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">지역 / 시간대</div>
            <div className="mt-2 text-sm text-[var(--color-text-secondary)]">{timeZone}</div>
          </div>
        </div>
      </Section>

      <Section title="테마" description="모드를 선택하면 바로 인터페이스에 적용됩니다.">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { id: "light", label: "라이트", icon: <Sun className="h-4 w-4" /> },
            { id: "dark", label: "다크", icon: <Moon className="h-4 w-4" /> },
            { id: "jungle", label: "정글", icon: <Globe className="h-4 w-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onThemeChange(item.id as ObnofiTheme)}
              className={`rounded-lg px-4 py-3 ring-1 ${
                themeLabel === item.id
                  ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)] ring-[var(--color-accent)]"
                  : "bg-[var(--color-background)] text-[var(--color-text-secondary)] ring-[var(--color-border)] hover:bg-[var(--color-hover)]"
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-medium">
                {item.icon}
                {item.label}
              </div>
              <div className="mt-2 text-xs">
                {themeLabel === item.id ? "현재 적용됨" : "클릭해서 적용"}
              </div>
            </button>
          ))}
        </div>
      </Section>

      <Section title="알림" description="이메일 및 푸시 알림 채널 구성을 위한 자리입니다.">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <Mail className="h-4 w-4 text-[var(--color-text-secondary)]" />
              이메일 알림
            </div>
            <DisabledPill>준비 중</DisabledPill>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <Bell className="h-4 w-4 text-[var(--color-text-secondary)]" />
              푸시 알림
            </div>
            <DisabledPill>준비 중</DisabledPill>
          </div>
        </div>
      </Section>

      <Section
        title="계정 삭제"
        description="삭제는 아직 서버 보호 절차가 준비되지 않아 비활성화되어 있습니다."
      >
        <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
          <div className="space-y-1">
            <div className="text-sm font-medium text-[var(--color-text-primary)]">
              계정 영구 삭제
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              삭제 전에 워크스페이스 소유권 이전과 데이터 정리 플로우가 필요합니다.
            </div>
          </div>
          <ActionButton disabled variant="danger">
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </ActionButton>
        </div>
      </Section>
    </div>
  );
}
