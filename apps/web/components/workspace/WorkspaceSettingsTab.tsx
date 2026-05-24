"use client";

import Image from "next/image";
import { ExternalLink, Link2, Shield, Trash2 } from "lucide-react";
import {
  Section,
  Row,
  DisabledPill,
  ActionButton,
  formatDate,
  type WorkspaceSettingsResponse,
} from "./SettingsShared";

interface WorkspaceSettingsTabProps {
  workspaceSettings: WorkspaceSettingsResponse;
  defaultVisibilityLabel: string;
}

export function WorkspaceSettingsTab({
  workspaceSettings,
  defaultVisibilityLabel,
}: WorkspaceSettingsTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          워크스페이스 설정
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          일반 정보, 멤버, 접근 및 보안 구성을 한곳에서 확인합니다.
        </p>
      </div>

      <Section title="일반" description="이름, 아이콘, 도메인, 삭제 관련 항목입니다.">
        <Row label="워크스페이스 이름 / 아이콘">
          <div className="flex items-center gap-3 rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-surface)] text-lg">
              {workspaceSettings.workspace.icon ?? "🌿"}
            </div>
            <div>
              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                {workspaceSettings.workspace.name}
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                내 역할: {workspaceSettings.viewerRole}
              </div>
            </div>
          </div>
        </Row>

        <Row label="도메인 설정" description="현재 slug 기반 경로를 사용합니다.">
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div>
              <div className="text-sm text-[var(--color-text-primary)]">
                obnofi.so/{workspaceSettings.workspace.slug}
              </div>
              <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                커스텀 URL 연결은 아직 미구현입니다.
              </div>
            </div>
            <DisabledPill>준비 중</DisabledPill>
          </div>
        </Row>

        <Row label="워크스페이스 삭제">
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="text-xs text-[var(--color-text-secondary)]">
              멤버, 페이지, 데이터베이스를 포함한 전체 데이터 삭제 플로우는 아직 연결되지 않았습니다.
            </div>
            <ActionButton disabled variant="danger">
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </ActionButton>
          </div>
        </Row>
      </Section>

      <Section title="멤버" description="초대와 권한 관리를 위한 영역입니다.">
        <Row label="멤버 초대">
          <div className="flex gap-2">
            <input
              disabled
              value=""
              readOnly
              placeholder="name@example.com"
              className="h-10 flex-1 rounded-md bg-[var(--color-background)] px-3 text-sm text-[var(--color-text-secondary)] outline-none ring-1 ring-[var(--color-border)]"
            />
            <ActionButton disabled variant="secondary">
              초대
            </ActionButton>
          </div>
        </Row>

        <Row label="초대 링크 생성">
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <Link2 className="h-4 w-4 text-[var(--color-text-secondary)]" />
              링크 기반 초대
            </div>
            <DisabledPill>준비 중</DisabledPill>
          </div>
        </Row>

        <div className="space-y-3">
          {workspaceSettings.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                {member.user.image ? (
                  <Image
                    src={member.user.image}
                    alt={member.user.name ?? member.user.email}
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-white">
                    {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                    {member.user.name ?? "이름 없음"}
                  </div>
                  <div className="truncate text-xs text-[var(--color-text-secondary)]">
                    {member.user.email} · {formatDate(member.joinedAt)} 참여
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-md bg-[var(--color-hover)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-primary)]">
                  {member.role.toLowerCase()}
                </div>
                <ActionButton disabled variant="ghost">
                  제거
                </ActionButton>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="접근 / 보안" description="기본 공개 범위와 게스트 접근 정책입니다.">
        <Row label="기본 페이지 공개 범위">
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <Shield className="h-4 w-4 text-[var(--color-text-secondary)]" />
              {defaultVisibilityLabel}
            </div>
            <DisabledPill>읽기 전용</DisabledPill>
          </div>
        </Row>

        <Row label="게스트 접근">
          <div className="flex items-center justify-between rounded-lg bg-[var(--color-background)] px-4 py-3 ring-1 ring-[var(--color-border)]">
            <div className="text-sm text-[var(--color-text-primary)]">
              {workspaceSettings.workspace.settings.allowGuestAccess ? "허용됨" : "비허용"}
            </div>
            <DisabledPill>읽기 전용</DisabledPill>
          </div>
        </Row>
      </Section>

      <Section
        title="추가 작업"
        description="설정 페이지를 별도 화면으로 열고 싶다면 기존 경로도 유지됩니다."
      >
        <a
          href="/settings"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-accent)] hover:underline"
        >
          전체 설정 페이지 열기
          <ExternalLink className="h-4 w-4" />
        </a>
      </Section>
    </div>
  );
}
