import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-white dark:bg-[#111110]">
      <main className="flex flex-col items-center justify-center gap-8 px-4">
        <h1 className="text-5xl font-bold text-[#111110] dark:text-zinc-100">
          Obnofi
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md text-center">
          A Notion-like workspace with publishing. Create, edit, and share your
          pages with unique URLs.
        </p>
        <Link
          href="/workspace/ws-1?page=page-1"
          className="px-6 py-3 text-sm font-medium text-white bg-[#2E7D45] rounded-lg hover:bg-[#256a3a] transition-colors"
        >
          Get Started
        </Link>
      </main>
    </div>
  );
}
