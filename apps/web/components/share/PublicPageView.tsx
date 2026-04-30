"use client";

import { Editor } from "@/components/editor/Editor";
import { PageGlyph } from "@/components/workspace/PageGlyph";

interface PublicPageViewProps {
  title: string;
  icon: string | null;
  coverImage: string | null;
  content: object | null;
  updatedAt: string;
}

export function PublicPageView({
  title,
  icon,
  coverImage,
  content,
  updatedAt,
}: PublicPageViewProps) {
  const formattedDate = new Date(updatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const fakePage = { icon, type: "document" as const };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111110]">
      {coverImage ? (
        <div
          className="h-48 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${coverImage})` }}
        />
      ) : (
        <div className="h-12" />
      )}

      <div className="max-w-4xl mx-auto">
        <article className="px-8 pb-20">
          <div className={coverImage ? "-mt-6 mb-3" : "mb-3"}>
            <PageGlyph
              page={fakePage}
              emojiClassName="text-5xl leading-none"
              typeClassName="w-10 h-10 text-zinc-400"
            />
          </div>

          <h1 className="text-4xl font-bold text-[#111110] dark:text-zinc-100 mb-4">
            {title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-8">
            <span>Last edited {formattedDate}</span>
          </div>

          <div className="text-[#111110] dark:text-zinc-300 leading-relaxed">
            <Editor content={content} editable={false} />
          </div>
        </article>
      </div>
    </div>
  );
}
