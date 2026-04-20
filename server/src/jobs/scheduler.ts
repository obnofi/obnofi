import cron from "node-cron";
import { fetchVelogPosts } from "./crawlers/velog.js";
import { fetchOpenAIPosts } from "./crawlers/openai.js";
import { fetchAnthropicPosts } from "./crawlers/anthropic.js";

// TODO: Prisma client 연결 후 실제 DB에 upsert 처리
// import { prisma } from "../lib/prisma.js"

export function startCrawlerScheduler() {
  // 매 시간 정각 실행
  cron.schedule("0 * * * *", async () => {
    console.log("[crawler] starting feed refresh");

    await Promise.allSettled([
      runOpenAICrawler(),
      runAnthropicCrawler(),
      // Velog는 구독자별로 실행 — DB에서 구독 목록 읽어 처리
      // runVelogCrawlers(),
    ]);

    console.log("[crawler] feed refresh done");
  });

  console.log("[crawler] scheduler registered (every hour)");
}

async function runOpenAICrawler() {
  try {
    const posts = await fetchOpenAIPosts();
    console.log(`[crawler] openai: ${posts.length} posts`);
    // TODO: prisma.feedItem.upsert(...)
  } catch (err) {
    console.error("[crawler] openai failed:", err);
  }
}

async function runAnthropicCrawler() {
  try {
    const posts = await fetchAnthropicPosts();
    console.log(`[crawler] anthropic: ${posts.length} posts`);
    // TODO: prisma.feedItem.upsert(...)
  } catch (err) {
    console.error("[crawler] anthropic failed:", err);
  }
}

export async function runVelogCrawlerForUser(username: string) {
  const posts = await fetchVelogPosts(username);
  console.log(`[crawler] velog @${username}: ${posts.length} posts`);
  // TODO: prisma.feedItem.upsert(...)
  return posts;
}
