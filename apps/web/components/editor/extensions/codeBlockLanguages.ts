// 지원하는 프로그래밍 언어 목록 및 관련 타입

export const LANGUAGES = [
  { id: "javascript", label: "JavaScript", sandpackTemplate: "vanilla" as const },
  { id: "typescript", label: "TypeScript", sandpackTemplate: "vanilla-ts" as const },
  { id: "react", label: "React", sandpackTemplate: "react" as const },
  { id: "react-ts", label: "React TS", sandpackTemplate: "react-ts" as const },
  { id: "vue", label: "Vue", sandpackTemplate: "vue" as const },
  { id: "angular", label: "Angular", sandpackTemplate: "angular" as const },
  { id: "svelte", label: "Svelte", sandpackTemplate: "svelte" as const },
  { id: "solid", label: "Solid", sandpackTemplate: "solid" as const },
  { id: "python", label: "Python", sandpackTemplate: null },
  { id: "node", label: "Node.js", sandpackTemplate: "node" as const },
  { id: "nextjs", label: "Next.js", sandpackTemplate: "nextjs" as const },
  { id: "vite-react", label: "Vite React", sandpackTemplate: "vite-react" as const },
  { id: "vite-vue", label: "Vite Vue", sandpackTemplate: "vite-vue" as const },
  { id: "vite-svelte", label: "Vite Svelte", sandpackTemplate: "vite-svelte" as const },
  { id: "astro", label: "Astro", sandpackTemplate: "astro" as const },
  { id: "rust", label: "Rust", sandpackTemplate: "rust" as const },
  { id: "go", label: "Go", sandpackTemplate: "go" as const },
  { id: "java", label: "Java", sandpackTemplate: null },
  { id: "cpp", label: "C++", sandpackTemplate: null },
  { id: "html", label: "HTML", sandpackTemplate: "static" as const },
  { id: "css", label: "CSS", sandpackTemplate: null },
  { id: "json", label: "JSON", sandpackTemplate: null },
  { id: "markdown", label: "Markdown", sandpackTemplate: null },
  { id: "bash", label: "Bash", sandpackTemplate: null },
  { id: "sql", label: "SQL", sandpackTemplate: null },
  { id: "graphql", label: "GraphQL", sandpackTemplate: null },
  { id: "plaintext", label: "Plain Text", sandpackTemplate: null },
] as const;

export type LanguageId = (typeof LANGUAGES)[number]["id"];

export interface CodeBlockAttrs {
  language: LanguageId;
  code: string;
  isOpen: boolean;
}
