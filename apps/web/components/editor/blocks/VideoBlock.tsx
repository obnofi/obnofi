"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type ReactNodeViewProps,
} from "@tiptap/react";
import { Link2, Upload, Video } from "lucide-react";
import { uploadGroveMediaAsset } from "@/lib/supabase";

type VideoBlockAttrs = {
  src: string;
  title: string;
  pageId: string | null;
};

interface VideoBlockOptions {
  pageId?: string;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("동영상 파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

function VideoBlockView(props: ReactNodeViewProps) {
  const attrs = props.node.attrs as VideoBlockAttrs;
  const isEditable = props.editor.isEditable;
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUrl, setPendingUrl] = useState(attrs.src);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setPendingUrl(attrs.src);
  }, [attrs.src]);

  const handleMouseDown = (event: MouseEvent | ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const commitUrl = (rawUrl: string) => {
    props.updateAttributes({ src: rawUrl.trim() });
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    handleMouseDown(event);
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      event.target.value = "";
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const src = attrs.pageId
        ? await uploadGroveMediaAsset(file, attrs.pageId).catch(() => readFileAsDataUrl(file))
        : await readFileAsDataUrl(file);

      props.updateAttributes({
        src,
        title: attrs.title || file.name.replace(/\.[^.]+$/, ""),
      });
      setPendingUrl(src);
    } catch {
      setUploadError("동영상을 올리지 못했습니다.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  return (
    <NodeViewWrapper
      className="not-prose my-4"
      data-testid="video-block"
      contentEditable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <div className="grove-media-block">
        {attrs.src ? (
          <video className="grove-media-block__video" controls src={attrs.src}>
            브라우저가 video 태그를 지원하지 않습니다.
          </video>
        ) : (
          <div className="grove-media-block__empty">
            <Video className="h-5 w-5" />
            <span>동영상을 추가하세요</span>
          </div>
        )}

        {isEditable ? (
          <div className="grove-media-block__controls" onMouseDown={(event) => event.stopPropagation()}>
            <input
              ref={fileInputRef}
              id={inputId}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => void handleFileChange(event)}
            />
            <div className="grove-media-block__actions">
              <button
                type="button"
                className="grove-image-block__button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                <span>{isUploading ? "업로드 중..." : attrs.src ? "동영상 교체" : "동영상 업로드"}</span>
              </button>
              <label className="grove-image-block__url" htmlFor={`${inputId}-url`}>
                <Link2 className="h-4 w-4" />
                <input
                  id={`${inputId}-url`}
                  type="url"
                  value={pendingUrl}
                  placeholder="https://..."
                  onMouseDown={(event) => event.stopPropagation()}
                  onChange={(event) => setPendingUrl(event.target.value)}
                  onBlur={() => commitUrl(pendingUrl)}
                />
              </label>
            </div>
            <input
              type="text"
              value={attrs.title}
              placeholder="제목"
              className="grove-image-block__caption"
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) => props.updateAttributes({ title: event.target.value })}
            />
            {uploadError ? <p className="grove-image-block__error">{uploadError}</p> : null}
          </div>
        ) : attrs.title ? (
          <p className="grove-image-block__caption grove-image-block__caption--readonly">
            {attrs.title}
          </p>
        ) : null}
      </div>
    </NodeViewWrapper>
  );
}

export const VideoBlock = Node.create<VideoBlockOptions>({
  name: "videoBlock",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { pageId: undefined };
  },

  addAttributes() {
    return {
      src: { default: "" },
      title: { default: "" },
      pageId: { default: this.options.pageId ?? null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='video-block']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "video-block" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoBlockView);
  },

  addCommands() {
    return {
      insertVideoBlock:
        (attrs?: Partial<VideoBlockAttrs>) =>
        ({ commands }) =>
          commands.insertContent([
            {
              type: this.name,
              attrs: {
                src: attrs?.src ?? "",
                title: attrs?.title ?? "",
                pageId: attrs?.pageId ?? this.options.pageId ?? null,
              },
            },
            { type: "paragraph" },
          ]),
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoBlock: {
      insertVideoBlock: (attrs?: Partial<VideoBlockAttrs>) => ReturnType;
    };
  }
}
