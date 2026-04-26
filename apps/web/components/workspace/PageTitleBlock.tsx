"use client";

import { useEffect, useRef, useState } from "react";

interface PageTitleBlockProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: "page" | "side-tab";
  testId?: string;
}

const sizeClasses: Record<NonNullable<PageTitleBlockProps["size"]>, string> = {
  page: "text-[40px]",
  "side-tab": "text-[34px]",
};

export function PageTitleBlock({
  value,
  onChange,
  placeholder = "Untitled",
  size = "page",
  testId,
}: PageTitleBlockProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const commitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFocusedRef = useRef(false);
  const isComposingRef = useRef(false);
  const lastCommittedValueRef = useRef(value);
  const [draftValue, setDraftValue] = useState(value);

  const clearCommitTimer = () => {
    if (commitTimerRef.current) {
      clearTimeout(commitTimerRef.current);
      commitTimerRef.current = null;
    }
  };

  const commitValue = (nextValue: string) => {
    clearCommitTimer();

    if (lastCommittedValueRef.current === nextValue) {
      return;
    }

    lastCommittedValueRef.current = nextValue;
    onChange(nextValue);
  };

  const scheduleCommit = (nextValue: string) => {
    clearCommitTimer();
    commitTimerRef.current = setTimeout(() => {
      commitValue(nextValue);
    }, 250);
  };

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) {
      return;
    }

    node.style.height = "0px";
    node.style.height = `${node.scrollHeight}px`;
  }, [draftValue]);

  useEffect(() => {
    if (isFocusedRef.current || isComposingRef.current) {
      return;
    }

    setDraftValue(value);
    lastCommittedValueRef.current = value;
  }, [value]);

  useEffect(() => {
    return () => {
      clearCommitTimer();
    };
  }, []);

  return (
    <div className="mb-6">
      <textarea
        ref={textareaRef}
        rows={1}
        value={draftValue}
        placeholder={placeholder}
        data-testid={testId}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          commitValue(draftValue);
        }}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={(event) => {
          isComposingRef.current = false;
          const nextValue = event.currentTarget.value;
          setDraftValue(nextValue);
          scheduleCommit(nextValue);
        }}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);

          if (!isComposingRef.current) {
            scheduleCommit(nextValue);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        className={`grove-page-title-block w-full resize-none overflow-hidden rounded-xl border border-transparent bg-transparent px-3 py-2 font-bold text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-placeholder)] ${sizeClasses[size]}`}
      />
    </div>
  );
}
