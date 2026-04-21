export type ElementKind = "sticky" | "shape" | "text" | "image" | "embed" | "path" | "connector" | "section";
export type PresenceColor = "ink" | "fern" | "mist" | "sun" | "rose" | "sky";
export type StickyTone = "sun" | "rose" | "sky";
export type ShapeKind = "rectangle" | "ellipse" | "diamond" | "triangle";
export type RoomBackground = "paper" | "board";

export interface Point {
  x: number;
  y: number;
}

export interface ElementStyle {
  color: PresenceColor | string;
  strokeWidth?: number;
  opacity: number;
}

export interface BaseElement<TType extends ElementKind, TContent> {
  id: string;
  roomId: string;
  type: TType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  style: ElementStyle;
  content: TContent;
}

export type StickyElement = BaseElement<
  "sticky",
  {
    kind: "sticky";
    text: string;
    tone: StickyTone;
    votes?: Record<string, number>;
  }
>;

export type ShapeElement = BaseElement<
  "shape",
  {
    kind: "shape";
    shape: ShapeKind;
    fill: PresenceColor | string;
    label: string;
    votes?: Record<string, number>;
  }
>;

export type TextElement = BaseElement<
  "text",
  {
    kind: "text";
    text: string;
    fontSize: number;
    align: "left" | "center" | "right";
    weight: 400 | 500 | 600 | 700;
  }
>;

export type ImageElement = BaseElement<
  "image",
  {
    kind: "image";
    url: string;
    src: string;
    alt: string;
    objectFit: "cover" | "contain";
    borderRadius: number;
    aspectRatio: number;
  }
>;

export type EmbedElement = BaseElement<
  "embed",
  {
    kind: "embed";
    url: string;
    embedType: "youtube" | "figma" | "google-maps" | "link-card";
    embedUrl?: string;
    title: string;
    domain: string;
    faviconUrl?: string;
    borderRadius: number;
  }
>;

export type PathElement = BaseElement<
  "path",
  {
    kind: "path";
    points: Point[];
    closed: boolean;
  }
>;

export type LineStyle = "arrow" | "solid" | "dashed" | "dotted";

export type ConnectorElement = BaseElement<
  "connector",
  {
    kind: "connector";
    start: Point;
    end: Point;
    fromElementId?: string;
    toElementId?: string;
    arrowStart: boolean;
    arrowEnd: boolean;
    lineStyle: LineStyle;
    label?: string;
  }
>;

export type SectionElement = BaseElement<
  "section",
  {
    kind: "section";
    title: string;
    background: string;
  }
>;

export type Element =
  | StickyElement
  | ShapeElement
  | TextElement
  | ImageElement
  | EmbedElement
  | PathElement
  | ConnectorElement
  | SectionElement;

export interface User {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  color: PresenceColor;
  cursor?: Point;
  cursorChat?: {
    message: string;
    createdAt: number;
  } | null;
  connectedAt: string;
  lastSeenAt: string;
}

export interface Room {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  background: RoomBackground;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  roomId: string;
  elementId: string | null;
  authorId: string;
  body: string;
  content?: string;
  parentId?: string | null;
  x?: number;
  y?: number;
  createdAt: string;
  updatedAt: string;
  resolved?: boolean;
  resolvedAt?: string;
}
