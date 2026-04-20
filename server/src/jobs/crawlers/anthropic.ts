import axios from "axios";
import * as cheerio from "cheerio";
import type { FeedEntry } from "./openai.js";

const ANTHROPIC_BLOG = "https://www.anthropic.com/news";

export async function fetchAnthropicPosts(): Promise<FeedEntry[]> {
  const { data } = await axios.get(ANTHROPIC_BLOG, { timeout: 10_000 });
  const $ = cheerio.load(data);
  const posts: FeedEntry[] = [];

  $("article, [class*='PostCard'], [class*='post-card']").each((_, el) => {
    const title = $(el).find("h3, h2, h4").first().text().trim();
    const href = $(el).find("a").first().attr("href") ?? "";
    const summary = $(el).find("p").first().text().trim();
    const thumbnail = $(el).find("img").first().attr("src") ?? null;
    const time = $(el).find("time").attr("datetime") ?? null;

    if (title && href) {
      posts.push({
        title,
        url: href.startsWith("http") ? href : `https://www.anthropic.com${href}`,
        summary,
        thumbnail,
        publishedAt: time,
      });
    }
  });

  return posts;
}
