"use client";

import { useCallback } from "react";
import { RotateCcw } from "lucide-react";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackConsole,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { LANGUAGES, type LanguageId } from "./codeBlockLanguages";

// Sandpack 재실행 버튼 컴포넌트
export function SandpackRerunButton() {
  const { sandpack } = useSandpack();

  return (
    <button
      type="button"
      onClick={() => sandpack.runSandpack()}
      className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]"
      title="다시 실행"
    >
      <RotateCcw className="h-3.5 w-3.5" />
      <span>재실행</span>
    </button>
  );
}

/** localCode 와 언어 ID를 받아 Sandpack에 넘길 파일 맵을 반환 */
export function getSandpackFiles(
  sandpackTemplate: (typeof LANGUAGES)[number]["sandpackTemplate"],
  localCode: string
): Record<string, string> {
  if (!sandpackTemplate) return {};

  switch (sandpackTemplate) {
    case "vanilla":
      return {
        "/index.js": localCode,
        "/index.html": `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Sandpack</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.js"></script>
  </body>
</html>`,
      };
    case "vanilla-ts":
      return {
        "/index.ts": localCode,
        "/index.html": `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Sandpack</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="index.ts"></script>
  </body>
</html>`,
      };
    case "react":
      return { "/App.js": localCode };
    case "react-ts":
      return { "/App.tsx": localCode };
    case "static":
      return { "/index.html": localCode };
    case "vue":
      return { "/src/App.vue": localCode };
    case "svelte":
      return { "/App.svelte": localCode };
    case "nextjs":
      return { "/pages/index.js": localCode };
    case "node":
      return { "/index.js": localCode };
    default:
      return { "/index.js": localCode };
  }
}

interface CodeBlockSandpackPreviewProps {
  language: LanguageId;
  localCode: string;
}

export function CodeBlockSandpackPreview({ language, localCode }: CodeBlockSandpackPreviewProps) {
  const currentLang = LANGUAGES.find((l) => l.id === language) ?? LANGUAGES[0];

  const getFiles = useCallback(
    () => getSandpackFiles(currentLang.sandpackTemplate, localCode),
    [currentLang.sandpackTemplate, localCode]
  );

  if (!currentLang.sandpackTemplate) return null;

  return (
    <div className="min-h-[200px] bg-[var(--color-background)]">
      <SandpackProvider
        template={currentLang.sandpackTemplate as never}
        files={getFiles() as never}
        options={{
          recompileMode: "delayed",
          recompileDelay: 500,
          autorun: true,
        }}
        theme={{
          colors: {
            surface1: "var(--color-background)",
            surface2: "var(--color-surface)",
            surface3: "var(--color-hover)",
            clickable: "var(--color-text-secondary)",
            base: "var(--color-text-primary)",
            disabled: "var(--color-text-placeholder)",
            hover: "var(--color-hover)",
            accent: "var(--color-accent)",
            error: "#ef4444",
            errorSurface: "#fef2f2",
          },
          syntax: {
            plain: "var(--color-text-primary)",
            comment: {
              color: "var(--color-text-secondary)",
              fontStyle: "italic",
            },
            keyword: "var(--color-accent)",
            tag: "#2563eb",
            punctuation: "var(--color-text-secondary)",
            definition: "var(--color-text-primary)",
            property: "var(--color-text-primary)",
            static: "#dc2626",
            string: "#16a34a",
          },
          font: {
            size: "14px",
            lineHeight: "1.5",
          },
        }}
      >
        <div className="flex h-full flex-col">
          {/* Sandpack 툴바 */}
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
              미리보기
            </span>
            <SandpackRerunButton />
          </div>

          {/* Sandpack 레이아웃 */}
          <SandpackLayout className="!border-0 !rounded-none">
            <SandpackPreview
              className="!h-[250px]"
              showRefreshButton={false}
              showOpenInCodeSandbox={false}
            />
          </SandpackLayout>

          {/* 콘솔 출력 */}
          <div className="flex-1 border-t border-[var(--color-border)]">
            <SandpackConsole className="!h-[120px]" showHeader={false} />
          </div>
        </div>
      </SandpackProvider>
    </div>
  );
}
