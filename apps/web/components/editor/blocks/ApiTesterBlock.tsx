"use client";

import { useMemo, useState } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Play, RefreshCw, TerminalSquare } from "lucide-react";
import { FallingLeavesLoader } from "@/components/FallingLeavesLoader";

type ApiTesterMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

type ApiTesterAttrs = {
  method: ApiTesterMethod;
  url: string;
  headersText: string;
  body: string;
};

type ResponseState = {
  ok: boolean;
  status: number;
  statusText: string;
  durationMs: number;
  bodyText: string;
  contentType: string;
};

const METHODS_WITH_BODY = new Set<ApiTesterMethod>(["POST", "PUT", "PATCH", "DELETE"]);

function parseHeaders(headersText: string) {
  const headers = new Headers();
  const invalidLines: string[] = [];

  for (const rawLine of headersText.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex <= 0) {
      invalidLines.push(line);
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!key) {
      invalidLines.push(line);
      continue;
    }

    headers.set(key, value);
  }

  return { headers, invalidLines };
}

function tryFormatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
}

function ApiTesterBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as ApiTesterAttrs;
  const [isRunning, setIsRunning] = useState(false);
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isEditable = props.editor.isEditable;
  const hasRequestBody = METHODS_WITH_BODY.has(attrs.method);

  const parsedHeaders = useMemo(
    () => parseHeaders(attrs.headersText ?? ""),
    [attrs.headersText]
  );

  const canRun = Boolean(attrs.url.trim()) && parsedHeaders.invalidLines.length === 0;

  const runRequest = async () => {
    if (!canRun || isRunning) return;

    setIsRunning(true);
    setErrorMessage(null);

    try {
      const startedAt = performance.now();
      const init: RequestInit = {
        method: attrs.method,
        headers: parsedHeaders.headers,
        credentials: "include",
      };

      if (hasRequestBody) {
        init.body = attrs.body;
      }

      const result = await fetch(attrs.url, init);
      const bodyText = await result.text();
      const durationMs = Math.round(performance.now() - startedAt);

      setResponse({
        ok: result.ok,
        status: result.status,
        statusText: result.statusText,
        durationMs,
        bodyText: tryFormatJson(bodyText),
        contentType: result.headers.get("content-type") ?? "",
      });
    } catch (error) {
      setResponse(null);
      setErrorMessage(
        error instanceof Error ? error.message : "Request failed"
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <section className="grove-api-tester" data-testid="api-tester-block">
        <div className="grove-api-tester__header">
          <div className="grove-api-tester__title">
            <span className="grove-api-tester__glyph" aria-hidden="true">
              <TerminalSquare className="h-4 w-4" />
            </span>
            <div>
              <p className="grove-api-tester__eyebrow">Developer Tool</p>
              <h3 className="grove-api-tester__name">API 테스터</h3>
            </div>
          </div>
          <button
            className="grove-api-tester__run"
            type="button"
            onClick={runRequest}
            disabled={!canRun || isRunning}
          >
            {isRunning ? (
              <FallingLeavesLoader size="sm" className="text-[var(--color-text-primary)]" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>{isRunning ? "요청 중" : "요청 보내기"}</span>
          </button>
        </div>

        <div className="grove-api-tester__request">
          <div className="grove-api-tester__endpoint">
            <label className="grove-api-tester__method">
              <span className="sr-only">HTTP method</span>
              <select
                value={attrs.method}
                disabled={!isEditable}
                onChange={(event) =>
                  props.updateAttributes({ method: event.target.value as ApiTesterMethod })
                }
              >
                {["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label className="grove-api-tester__url">
              <span className="sr-only">Request URL</span>
              <input
                value={attrs.url}
                readOnly={!isEditable}
                placeholder="https://api.example.com/v1/resource"
                onChange={(event) => props.updateAttributes({ url: event.target.value })}
              />
            </label>
          </div>

          <div className="grove-api-tester__panes">
            <label className="grove-api-tester__pane">
              <span className="grove-api-tester__label">Headers</span>
              <textarea
                value={attrs.headersText}
                readOnly={!isEditable}
                rows={5}
                placeholder={"Authorization: Bearer <token>\nContent-Type: application/json"}
                onChange={(event) =>
                  props.updateAttributes({ headersText: event.target.value })
                }
              />
            </label>

            <label className="grove-api-tester__pane">
              <span className="grove-api-tester__label">
                Body
                {!hasRequestBody ? " (optional)" : ""}
              </span>
              <textarea
                value={attrs.body}
                readOnly={!isEditable}
                rows={5}
                placeholder='{"query":"value"}'
                onChange={(event) => props.updateAttributes({ body: event.target.value })}
              />
            </label>
          </div>

          {parsedHeaders.invalidLines.length > 0 ? (
            <p className="grove-api-tester__warning">
              헤더 형식이 잘못되었습니다: {parsedHeaders.invalidLines.join(", ")}
            </p>
          ) : null}
          <p className="grove-api-tester__hint">
            브라우저에서 직접 요청합니다. 동일 출처 또는 CORS 허용 API에서 가장 잘 동작합니다.
          </p>
        </div>

        <div className="grove-api-tester__response">
          <div className="grove-api-tester__response-bar">
            <div className="grove-api-tester__response-title">
              <span>Response</span>
              {response ? (
                <span
                  className={`grove-api-tester__status ${
                    response.ok
                      ? "grove-api-tester__status--success"
                      : "grove-api-tester__status--error"
                  }`}
                >
                  {response.status} {response.statusText}
                </span>
              ) : null}
            </div>
            {response ? (
              <div className="grove-api-tester__meta">
                <span>{response.durationMs}ms</span>
                {response.contentType ? <span>{response.contentType}</span> : null}
                <button
                  className="grove-api-tester__ghost"
                  type="button"
                  onClick={() => {
                    setResponse(null);
                    setErrorMessage(null);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>초기화</span>
                </button>
              </div>
            ) : null}
          </div>

          {errorMessage ? (
            <div className="grove-api-tester__empty grove-api-tester__empty--error">
              {errorMessage}
            </div>
          ) : response ? (
            <pre className="grove-api-tester__code">{response.bodyText || "(empty body)"}</pre>
          ) : (
            <div className="grove-api-tester__empty">
              요청을 보내면 상태 코드, 응답 시간, 본문이 여기에 표시됩니다.
            </div>
          )}
        </div>
      </section>
    </NodeViewWrapper>
  );
}

export const ApiTesterBlock = Node.create({
  name: "apiTesterBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      method: { default: "GET" },
      url: { default: "" },
      headersText: { default: "Accept: application/json" },
      body: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "section[data-type='api-tester-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "section",
      mergeAttributes(HTMLAttributes, { "data-type": "api-tester-block" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ApiTesterBlockView);
  },

  addCommands() {
    return {
      insertApiTesterBlock:
        (attrs?: Partial<ApiTesterAttrs>) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs,
          }),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    apiTesterBlock: {
      insertApiTesterBlock: (attrs?: Partial<ApiTesterAttrs>) => ReturnType;
    };
  }
}
