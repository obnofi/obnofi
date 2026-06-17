export interface AiGenerateRequest {
  prompt: string;
  context?: string;
  command: AiCommandType;
}

export interface AiGenerateResponse {
  text: string;
}

export type AiCommandType =
  | "summarize"
  | "translate"
  | "continue"
  | "improve"
  | "shorter"
  | "longer"
  | "explain"
  | "code";

export interface AiCommandItem {
  id: AiCommandType;
  title: string;
  description: string;
  icon: string;
}

export interface AiSuggestionProps {
  items: AiCommandItem[];
  command: (item: AiCommandItem) => void;
  query: string;
  editor: unknown;
  range: { from: number; to: number };
}
