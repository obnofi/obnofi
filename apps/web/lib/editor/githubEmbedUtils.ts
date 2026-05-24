export type GitHubEmbedKind = "repository" | "issue" | "pull" | "gist" | "file" | "unknown";

export type GitHubEmbedAttrs = {
  url: string;
  kind: GitHubEmbedKind;
  owner: string;
  repo: string;
  number: string;
  gistId: string;
  title: string;
};

export function normalizeGitHubUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseGitHubEmbedUrl(value: string): GitHubEmbedAttrs | null {
  const normalized = normalizeGitHubUrl(value);
  if (!normalized) return null;

  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.toLowerCase();
    const parts = parsed.pathname.split("/").filter(Boolean);

    if (host === "gist.github.com") {
      const owner = parts.length > 1 ? parts[0] : "";
      const gistId = parts.length > 1 ? parts[1] : parts[0] ?? "";
      if (!gistId) return null;

      return {
        url: parsed.toString(),
        kind: "gist",
        owner,
        repo: "",
        number: "",
        gistId,
        title: owner ? `${owner} / ${gistId}` : gistId,
      };
    }

    if (host !== "github.com" && host !== "www.github.com") {
      return null;
    }

    const [owner = "", repo = "", section = "", number = ""] = parts;
    if (!owner || !repo) return null;

    if (section === "issues" && number) {
      return {
        url: parsed.toString(),
        kind: "issue",
        owner,
        repo,
        number,
        gistId: "",
        title: `${owner}/${repo}#${number}`,
      };
    }

    if (section === "pull" && number) {
      return {
        url: parsed.toString(),
        kind: "pull",
        owner,
        repo,
        number,
        gistId: "",
        title: `${owner}/${repo}#${number}`,
      };
    }

    return {
      url: parsed.toString(),
      kind: section === "blob" || section === "tree" ? "file" : "repository",
      owner,
      repo,
      number: "",
      gistId: "",
      title: `${owner}/${repo}`,
    };
  } catch {
    return null;
  }
}

export function getGitHubEmbedLabel(attrs: GitHubEmbedAttrs) {
  if (attrs.kind === "issue") return `Issue #${attrs.number}`;
  if (attrs.kind === "pull") return `Pull request #${attrs.number}`;
  if (attrs.kind === "gist") return "Gist";
  if (attrs.kind === "file") return "Repository path";
  if (attrs.kind === "repository") return "Repository";
  return "GitHub";
}

export function getGitHubEmbedMeta(attrs: GitHubEmbedAttrs) {
  if (attrs.kind === "gist") {
    return attrs.owner ? `gist.github.com/${attrs.owner}` : "gist.github.com";
  }

  const target = [attrs.owner, attrs.repo].filter(Boolean).join("/");
  const label = getGitHubEmbedLabel(attrs);
  return target && label !== "GitHub" ? `${target} · ${label}` : target || "github.com";
}
