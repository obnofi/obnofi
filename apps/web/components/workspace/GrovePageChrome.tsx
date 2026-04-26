"use client";

import type { Page, UpdatePageInput } from "@obnofi/types";
import { GrovePageCanopy } from "@/components/workspace/GrovePageCanopy";
import { PageTitleBlock } from "@/components/workspace/PageTitleBlock";

interface GrovePageChromeProps {
  page: Page;
  title: string;
  onTitleChange: (value: string) => Promise<void>;
  onPageUpdate: (input: UpdatePageInput) => Promise<void>;
  hideTitle?: boolean;
}

export function GrovePageChrome({
  page,
  title,
  onTitleChange,
  onPageUpdate,
  hideTitle = false,
}: GrovePageChromeProps) {
  return (
    <>
      <GrovePageCanopy page={page} onUpdate={onPageUpdate} />
      {!hideTitle ? (
        <PageTitleBlock
          value={title}
          onChange={(nextTitle) => void onTitleChange(nextTitle)}
          placeholder="Untitled"
          size="page"
          testId="workspace-page-title"
        />
      ) : null}
    </>
  );
}
