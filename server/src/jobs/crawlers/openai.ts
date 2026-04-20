import axios from "axios";
import * as cheerio from "cheerio";

const OPENAI_BLOG = "https://openai.com/news";

export interface FeedEntry {
  title: string;
  url: string;
  summary: string;
  thumbnail: string | null;
  publishedAt: string | null;
}

export async function fetchOpenAIPosts(): Promise<FeedEntry[]> {
  const { data } = await axios.get(OPENAI_BLOG, { timeout: 10_000 });
  const $ = cheerio.load(data);
  const posts: FeedEntry[] = [];

  $("article").each((_, el) => {
    const title = $(el).find("h3, h2").first().text().trim();
    const href = $(el).find("a").first().attr("href") ?? "";
    const summary = $(el).find("p").first().text().trim();
    const thumbnail = $(el).find("img").first().attr("src") ?? null;
    const time = $(el).find("time").attr("datetime") ?? null;

    if (title && href) {
      posts.push({
        title,
        url: href.startsWith("http") ? href : `https://openai.com${href}`,
        summary,
        thumbnail,
        publishedAt: time,
      });
    }
  });

  return posts;
}
