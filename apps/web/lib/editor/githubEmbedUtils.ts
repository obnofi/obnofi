export type GitHubEmbedKind = "repository" | "issue" | "pull" | "gist" | "file" | "unknown";
export type GitHubEmbedVariant =
  | "githubEmbed"
  | "githubGist"
  | "githubIssue"
  | "githubPull";

type GitHubVariantConfig = {
  title: string;
  placeholder: string;
  actionLabel: string;
  allowedKinds: GitHubEmbedKind[];
};

export const GITHUB_EMBED_VARIANTS: Record<GitHubEmbedVariant, GitHubVariantConfig> = {
  githubEmbed: {
    title: "GitHub 임베드",
    placeholder: "Repository, Issue, PR, Gist 링크 붙여넣기",
    actionLabel: "임베드",
    allowedKinds: ["repository", "file", "issue", "pull", "gist"],
  },
  githubGist: {
    title: "GitHub Gist",
    placeholder: "Gist 링크 붙여넣기",
    actionLabel: "Gist 삽입",
    allowedKinds: ["gist"],
  },
  githubIssue: {
    title: "GitHub 이슈",
    placeholder: "GitHub 이슈 링크 붙여넣기",
    actionLabel: "이슈 삽입",
    allowedKinds: ["issue"],
  },
  githubPull: {
    title: "GitHub PR",
    placeholder: "GitHub PR 링크 붙여넣기",
    actionLabel: "PR 삽입",
    allowedKinds: ["pull"],
  },
};

export type GitHubEmbedAttrs = {
  url: string;
  kind: GitHubEmbedKind;
  variant: GitHubEmbedVariant;
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

export function parseGitHubEmbedUrl(
  value: string,
  variant: GitHubEmbedVariant = "githubEmbed"
): GitHubEmbedAttrs | null {
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

      const attrs: GitHubEmbedAttrs = {
        url: parsed.toString(),
        kind: "gist",
        variant,
        owner,
        repo: "",
        number: "",
        gistId,
        title: owner ? `${owner} / ${gistId}` : gistId,
      };
      return GITHUB_EMBED_VARIANTS[variant].allowedKinds.includes(attrs.kind)
        ? attrs
        : null;
    }

    if (host !== "github.com" && host !== "www.github.com") {
      return null;
    }

    const [owner = "", repo = "", section = "", number = ""] = parts;
    if (!owner || !repo) return null;

    if (section === "issues" && number) {
      const attrs: GitHubEmbedAttrs = {
        url: parsed.toString(),
        kind: "issue",
        variant,
        owner,
        repo,
        number,
        gistId: "",
        title: `${owner}/${repo}#${number}`,
      };
      return GITHUB_EMBED_VARIANTS[variant].allowedKinds.includes(attrs.kind)
        ? attrs
        : null;
    }

    if (section === "pull" && number) {
      const attrs: GitHubEmbedAttrs = {
        url: parsed.toString(),
        kind: "pull",
        variant,
        owner,
        repo,
        number,
        gistId: "",
        title: `${owner}/${repo}#${number}`,
      };
      return GITHUB_EMBED_VARIANTS[variant].allowedKinds.includes(attrs.kind)
        ? attrs
        : null;
    }

    const attrs: GitHubEmbedAttrs = {
      url: parsed.toString(),
      kind: section === "blob" || section === "tree" ? "file" : "repository",
      variant,
      owner,
      repo,
      number: "",
      gistId: "",
      title: `${owner}/${repo}`,
    };
    return GITHUB_EMBED_VARIANTS[variant].allowedKinds.includes(attrs.kind)
      ? attrs
      : null;
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
