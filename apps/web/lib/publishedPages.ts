import { Prisma, PublishedSnapshotType as PrismaPublishedSnapshotType, prisma } from "@obnofi/db";
import { resolvePersistedYjsContent } from "@/lib/yjsContent";
import { createGraphFromPages } from "@/lib/graph/graphDataUtils";
import { toPage } from "@/lib/prisma-transforms";
import { PAGE_GRAPH_SELECT } from "@/lib/prisma/selects";
import type {
  PublishedGraphSnapshotContent,
  PublishedPageSnapshotContent,
  PublishedSnapshotDetail,
  PublishedSnapshotManageResponse,
  PublishedSnapshotSummary,
  PublishedSnapshotType,
} from "@/lib/publishedPageTypes";

const MAX_TAGS = 5;
const MAX_DESCRIPTION_LENGTH = 160;
const PUBLISHED_SNAPSHOT_TYPE = {
  PAGE: "PAGE",
  CANVAS: "CANVAS",
  GRAPH: "GRAPH",
} as const;

type PersistedPublishedSnapshotType =
  | PrismaPublishedSnapshotType
  | (typeof PUBLISHED_SNAPSHOT_TYPE)[keyof typeof PUBLISHED_SNAPSHOT_TYPE];

type PublishedSnapshotRow = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  likeCount: number;
  createdAt: Date;
  snapshotType: PersistedPublishedSnapshotType;
  pageId: string | null;
  workspaceId: string | null;
  deletedAt?: Date | null;
  snapshotContent: PublishedPageSnapshotContent | PublishedGraphSnapshotContent;
  userId: string;
  user: { id: string; name: string | null; email: string; image: string | null };
  likes: Array<{ userId: string }>;
};

const publishedPageDelegate = (prisma as typeof prisma & {
  publishedPage?: {
    findFirst?: (...args: unknown[]) => Promise<unknown>;
    findMany?: (...args: unknown[]) => Promise<unknown>;
    updateMany?: (...args: unknown[]) => Promise<unknown>;
    create?: (...args: unknown[]) => Promise<unknown>;
    update?: (...args: unknown[]) => Promise<unknown>;
  };
  publishedPageLike?: {
    upsert?: (...args: unknown[]) => Promise<unknown>;
    deleteMany?: (...args: unknown[]) => Promise<unknown>;
    count?: (...args: unknown[]) => Promise<unknown>;
  };
}).publishedPage;

function hasPublishedPagesRuntime() {
  return Boolean(
    publishedPageDelegate?.findMany &&
      publishedPageDelegate?.findFirst &&
      publishedPageDelegate?.create &&
      prisma.publishedPageLike
  );
}

function isPublishedPagesTableMissing(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }

  if (error.code !== "P2021") {
    return false;
  }

  return (
    error.message.includes("public.PublishedPage") ||
    error.message.includes("public.PublishedPageLike") ||
    error.message.includes('"PublishedPage"') ||
    error.message.includes('"PublishedPageLike"')
  );
}

async function withPublishedPagesFallback<T>(
  runPrisma: () => Promise<T>,
  runMock: () => T | Promise<T>
): Promise<T> {
  try {
    return await runPrisma();
  } catch (error) {
    if (isPublishedPagesTableMissing(error)) {
      return await runMock();
    }
    throw error;
  }
}

function createMockPublishedSnapshotRow(input: {
  id: string;
  title: string;
  description: string;
  tags: string[];
  likeCount: number;
  createdAt: string;
  snapshotType: PersistedPublishedSnapshotType;
  pageId: string | null;
  workspaceId: string | null;
  snapshotContent: PublishedPageSnapshotContent | PublishedGraphSnapshotContent;
  user: { id: string; name: string | null; email: string; image: string | null };
  likes?: Array<{ userId: string }>;
}): PublishedSnapshotRow {
  return {
    ...input,
    createdAt: new Date(input.createdAt),
    deletedAt: null,
    userId: input.user.id,
    likes: input.likes ?? [],
  };
}

const globalForPublishedPages = globalThis as typeof globalThis & {
  __obnofiPublishedPagesMockStoreV2?: PublishedSnapshotRow[];
};

function getMockPublishedPagesStore() {
  if (!globalForPublishedPages.__obnofiPublishedPagesMockStoreV2) {
    globalForPublishedPages.__obnofiPublishedPagesMockStoreV2 = [
      createMockPublishedSnapshotRow({
        id: "forest-openai-codex-workflows",
        title: "Codex for every role, tool, and workflow",
        description: "OpenAI 블로그의 2026년 6월 2일 글을 바탕으로, 역할별 코딩 에이전트 활용 패턴을 정리한 Grove mock입니다.",
        tags: ["openai", "codex", "workflow"],
        likeCount: 31,
        createdAt: "2026-06-12T09:20:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "crawl-page-openai-codex",
        workspaceId: "crawl-workspace-openai",
        snapshotContent: {
          title: "Codex for every role, tool, and workflow",
          icon: "🧭",
          coverImage: null,
          updatedAt: "2026-06-12T09:00:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "에이전트를 팀 단위로 배치하는 패턴" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "공식 글에서 강조한 핵심은 Codex를 특정 직군의 도구가 아니라, 설계·구현·검증 흐름 전체에 걸쳐 붙이는 방식이었다.",
                  },
                ],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "리서치 담당 에이전트와 구현 담당 에이전트를 분리한다." }] }],
                  },
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "검증 단계에서는 로그와 테스트 출력을 읽는 별도 리뷰 루프가 필요하다." }] }],
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "crawl-user-openai",
          name: "OpenAI News",
          email: "news@openai.example",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-openai-memory",
        title: "Dreaming: Better memory for a more helpful ChatGPT",
        description: "OpenAI 뉴스의 2026년 6월 4일 글을 바탕으로, 기억 유지가 작업 연속성에 주는 영향을 요약한 목문서입니다.",
        tags: ["openai", "memory", "chatgpt"],
        likeCount: 18,
        createdAt: "2026-06-12T08:40:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "crawl-page-openai-memory",
        workspaceId: "crawl-workspace-openai",
        snapshotContent: {
          title: "Dreaming: Better memory for a more helpful ChatGPT",
          icon: "🫧",
          coverImage: null,
          updatedAt: "2026-06-12T08:15:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "장기 기억이 좋아질수록 대화 맥락을 다시 설명하는 비용이 줄고, 반복 작업을 문맥 단위로 이어서 처리하기 쉬워진다.",
                  },
                ],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "개인화된 작업 기록을 남길수록 다음 세션 진입 비용이 낮아진다." }] }],
                  },
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "기억은 편의뿐 아니라 컨텍스트 품질 관리 문제로도 봐야 한다." }] }],
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "crawl-user-openai",
          name: "OpenAI News",
          email: "news@openai.example",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-anthropic-fable",
        title: "Claude Fable 5 and Claude Mythos 5",
        description: "Anthropic Newsroom의 2026년 6월 9일 발표를 바탕으로, 난도 높은 지식 작업용 모델 업데이트를 정리한 Forest 카드입니다.",
        tags: ["anthropic", "claude", "models"],
        likeCount: 27,
        createdAt: "2026-06-11T16:10:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "crawl-page-anthropic-fable",
        workspaceId: "crawl-workspace-anthropic",
        snapshotContent: {
          title: "Claude Fable 5 and Claude Mythos 5",
          icon: "🪶",
          coverImage: null,
          updatedAt: "2026-06-11T15:45:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 2 },
                content: [{ type: "text", text: "어려운 지식 업무와 코딩에 초점" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "발표 문구는 hardest knowledge work and coding problems에 초점을 맞췄다. Forest에서는 이를 장문 분석, 코드 이해, 도구 연계를 밀어주는 흐름으로 재해석했다.",
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "crawl-user-anthropic",
          name: "Anthropic News",
          email: "news@anthropic.example",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-anthropic-glasswing",
        title: "Expanding Project Glasswing",
        description: "Anthropic의 2026년 6월 2일 발표를 바탕으로, 비영리 조직 지원 확장 소식을 정리한 mock publication입니다.",
        tags: ["anthropic", "nonprofit", "ai"],
        likeCount: 14,
        createdAt: "2026-06-11T10:30:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "crawl-page-anthropic-glasswing",
        workspaceId: "crawl-workspace-anthropic",
        snapshotContent: {
          title: "Expanding Project Glasswing",
          icon: "🪽",
          coverImage: null,
          updatedAt: "2026-06-11T10:10:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "약 150개 신규 조직과 15개 이상 국가로 확장한다는 발표를 참고해, 공익 조직이 AI 도구를 도입할 때 필요한 운영 체크포인트를 요약했다.",
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "crawl-user-anthropic",
          name: "Anthropic News",
          email: "news@anthropic.example",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-vercel-agentic-infra",
        title: "Agentic Infrastructure",
        description: "Vercel 블로그의 2026년 4월 9일 글을 바탕으로, 에이전트가 코드를 배포하고 검증하는 인프라 패턴을 정리한 mock note입니다.",
        tags: ["vercel", "agents", "infrastructure"],
        likeCount: 39,
        createdAt: "2026-06-10T18:05:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "crawl-page-vercel-agentic",
        workspaceId: "crawl-workspace-vercel",
        snapshotContent: {
          title: "Agentic Infrastructure",
          icon: "🏗️",
          coverImage: null,
          updatedAt: "2026-06-10T17:30:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "핵심 메시지는 에이전트가 사람 대신 배포 루프에 들어오는 순간, preview URL·rollback·sandbox가 기능이 아니라 전제가 된다는 점이다.",
                  },
                ],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "에이전트가 스스로 검증할 수 있는 URL surface가 필요하다." }] }],
                  },
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "운영 로그와 코드 컨텍스트가 한 시스템 안에 있어야 수정 제안이 빨라진다." }] }],
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "crawl-user-vercel",
          name: "Vercel Blog",
          email: "blog@vercel.example",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-google-agentic-gemini",
        title: "I/O 2026: Welcome to the agentic Gemini era",
        description: "Google AI 블로그의 2026년 I/O 포스트를 바탕으로, 더 proactive한 Gemini 경험을 요약한 Forest 목데이터입니다.",
        tags: ["google", "gemini", "agentic"],
        likeCount: 23,
        createdAt: "2026-06-10T11:50:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "crawl-page-google-gemini",
        workspaceId: "crawl-workspace-google",
        snapshotContent: {
          title: "I/O 2026: Welcome to the agentic Gemini era",
          icon: "✨",
          coverImage: null,
          updatedAt: "2026-06-10T11:15:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Google은 agentic Gemini라는 표현으로, 사용자가 지시를 던진 뒤에도 이어서 도와주는 상시형 흐름을 강조했다.",
                  },
                ],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Forest 카드에서는 메모 정리, 비즈니스 도구, 연구 보조처럼 연속성이 중요한 use case 위주로 재구성했다.",
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "crawl-user-google",
          name: "Google AI Blog",
          email: "ai@google.example",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-page",
        title: "Jungle Weekly Review",
        description: "한 주 동안 정리한 Grove 회고 snapshot입니다.",
        tags: ["weekly", "grove", "notes"],
        likeCount: 7,
        createdAt: "2026-06-03T09:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-1",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          title: "Jungle Weekly Review",
          icon: "🌿",
          coverImage: null,
          updatedAt: "2026-06-03T08:40:00.000Z",
          pageType: "document",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "이번 주 회고" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Forest mock snapshot입니다. Prisma PublishedPage delegate가 없는 환경에서도 화면 확인이 가능합니다.",
                  },
                ],
              },
              {
                type: "bulletList",
                content: [
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "제품 구조 정리" }] }],
                  },
                  {
                    type: "listItem",
                    content: [{ type: "paragraph", content: [{ type: "text", text: "캔버스 퍼블리시 플로우 점검" }] }],
                  },
                ],
              },
            ],
          },
        },
        user: {
          id: "demo-user-1",
          name: "Canopy",
          email: "canopy@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-canvas",
        title: "Clearing Sprint Map",
        description: "이번 스프린트용 Clearing 보드 snapshot입니다.",
        tags: ["canvas", "sprint", "planning"],
        likeCount: 12,
        createdAt: "2026-06-02T12:30:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.CANVAS,
        pageId: "demo-page-2",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          title: "Clearing Sprint Map",
          icon: null,
          coverImage: null,
          updatedAt: "2026-06-02T12:10:00.000Z",
          pageType: "canvas",
          content: {
            version: 2,
            layers: [
              {
                id: "shape-1",
                kind: "rectangle",
                x: 120,
                y: 120,
                width: 220,
                height: 120,
                stroke: "#2E7D45",
                fill: "#E8F5EC",
                radius: 24,
              },
              {
                id: "shape-2",
                kind: "ellipse",
                x: 430,
                y: 220,
                width: 180,
                height: 120,
                stroke: "#337EA9",
                fill: "#DDEBF1",
              },
            ],
          },
        },
        user: {
          id: "demo-user-2",
          name: "Moss",
          email: "moss@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-graph",
        title: "Workspace Graph View",
        description: "문서 연결 구조를 공유하는 Graph snapshot입니다. 노드를 클릭하면 해당 페이지의 상세 내용을 확인할 수 있으며, 엣지는 페이지 간 링크 관계를 나타냅니다. 워크스페이스 전체 지식 지도를 한눈에 파악할 때 유용합니다.",
        tags: ["graph", "wiki"],
        likeCount: 4,
        createdAt: "2026-06-01T16:20:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
        pageId: "demo-page-3",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          workspaceId: "demo-workspace-1",
          focusedPageId: "demo-page-3",
          nodes: [
            { id: "demo-page-1", title: "Review", x: 0, y: 0, size: 1, degree: 2, isFocused: false },
            { id: "demo-page-2", title: "Planning", x: 120, y: 40, size: 1, degree: 2, isFocused: false },
            { id: "demo-page-3", title: "Architecture", x: 50, y: 160, size: 1.2, degree: 3, isFocused: true },
          ],
          edges: [
            { source: "demo-page-1", target: "demo-page-3", thickness: 1.1, isUnresolved: false },
            { source: "demo-page-2", target: "demo-page-3", thickness: 0.9, isUnresolved: false },
          ],
        },
        user: {
          id: "demo-user-3",
          name: "Vine",
          email: "vine@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-reading",
        title: "2026 독서 기록",
        description: "올해 읽은 책 목록과 간단한 감상을 정리한 문서입니다. 소설, 인문학, 기술서적까지 다양한 분야를 아우르며 각 책에서 인상 깊었던 구절을 함께 남겼습니다. 매달 업데이트할 예정입니다.",
        tags: ["reading", "log", "books"],
        likeCount: 21,
        createdAt: "2026-05-30T08:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-4",
        workspaceId: "demo-workspace-2",
        snapshotContent: {
          title: "2026 독서 기록",
          icon: "📚",
          coverImage: null,
          updatedAt: "2026-05-30T07:40:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-4",
          name: "Fern",
          email: "fern@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-ux",
        title: "UX Research Note",
        description: "사용자 인터뷰 5건을 분석하고 공통 Pain Point를 추출한 노트입니다. 각 인터뷰에서 발견된 패턴을 Affinity Diagram으로 묶었으며, 우선순위 높은 개선 포인트 3가지를 도출했습니다. 팀 전체가 참고할 수 있도록 공유합니다.",
        tags: ["ux", "research", "interview"],
        likeCount: 15,
        createdAt: "2026-05-28T14:10:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-5",
        workspaceId: "demo-workspace-3",
        snapshotContent: {
          title: "UX Research Note",
          icon: "🔍",
          coverImage: null,
          updatedAt: "2026-05-28T13:50:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-5",
          name: "Bark",
          email: "bark@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-canvas-arch",
        title: "시스템 아키텍처 다이어그램",
        description: "마이크로서비스 전환 계획을 도식화한 Clearing 보드입니다.",
        tags: ["architecture", "canvas"],
        likeCount: 9,
        createdAt: "2026-05-25T11:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.CANVAS,
        pageId: "demo-page-6",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          title: "시스템 아키텍처 다이어그램",
          icon: null,
          coverImage: null,
          updatedAt: "2026-05-25T10:30:00.000Z",
          pageType: "canvas",
          content: { version: 2, layers: [] },
        },
        user: {
          id: "demo-user-2",
          name: "Moss",
          email: "moss@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-essay",
        title: "생산성에 대한 단상",
        description: "생산성이란 단순히 더 많은 일을 빠르게 처리하는 것이 아니라, 올바른 일을 적절한 타이밍에 집중해서 해내는 것이라고 생각합니다. GTD, 포모도로, 딥워크 등 여러 방법론을 직접 사용해보며 느낀 점들을 정리했습니다. 어떤 시스템도 결국 자기 자신에 대한 이해 없이는 작동하지 않는다는 결론에 이르렀습니다.",
        tags: ["essay", "productivity", "notes"],
        likeCount: 33,
        createdAt: "2026-05-20T09:30:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-7",
        workspaceId: "demo-workspace-4",
        snapshotContent: {
          title: "생산성에 대한 단상",
          icon: "✍️",
          coverImage: null,
          updatedAt: "2026-05-20T09:00:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-6",
          name: "Root",
          email: "root@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-sprint",
        title: "5월 스프린트 회고",
        description: "이번 스프린트에서 완료한 작업과 미완료 항목을 정리하고, 팀 전체가 공유할 액션 아이템을 도출한 문서입니다.",
        tags: ["sprint", "retrospective", "weekly"],
        likeCount: 6,
        createdAt: "2026-05-17T17:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-8",
        workspaceId: "demo-workspace-1",
        snapshotContent: {
          title: "5월 스프린트 회고",
          icon: "🌀",
          coverImage: null,
          updatedAt: "2026-05-17T16:40:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-1",
          name: "Canopy",
          email: "canopy@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-travel",
        title: "교토 여행 기록",
        description: "4박 5일 교토 여행 중 방문한 장소와 먹은 음식, 느낀 점을 정리했습니다. 아라시야마 대나무 숲, 후시미 이나리 신사, 니조성을 중심으로 동선을 짰고 각 장소마다 사진과 메모를 남겼습니다. 다음에 또 가고 싶은 곳 리스트도 포함되어 있습니다.",
        tags: ["travel", "japan", "log"],
        likeCount: 44,
        createdAt: "2026-05-14T10:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-9",
        workspaceId: "demo-workspace-5",
        snapshotContent: {
          title: "교토 여행 기록",
          icon: "🗾",
          coverImage: null,
          updatedAt: "2026-05-14T09:30:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-7",
          name: "Reed",
          email: "reed@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-cs",
        title: "CS 면접 준비 노트",
        description: "운영체제, 네트워크, 데이터베이스, 자료구조 알고리즘 영역별로 자주 나오는 질문과 핵심 답변을 정리한 문서입니다. 실제 면접에서 받은 질문도 추가로 기록했습니다.",
        tags: ["cs", "interview", "study"],
        likeCount: 58,
        createdAt: "2026-05-10T13:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-10",
        workspaceId: "demo-workspace-6",
        snapshotContent: {
          title: "CS 면접 준비 노트",
          icon: "💻",
          coverImage: null,
          updatedAt: "2026-05-10T12:40:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-8",
          name: "Spore",
          email: "spore@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-recipe",
        title: "자취 요리 레시피 모음",
        description: "혼자 살면서 만들어 먹기 좋은 레시피를 모았습니다. 재료가 3개 이하인 것만, 30분 안에 되는 것만 추려서 정리했고 칼로리와 단백질 정보도 함께 적었습니다.",
        tags: ["recipe", "daily", "food"],
        likeCount: 37,
        createdAt: "2026-05-06T18:30:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-11",
        workspaceId: "demo-workspace-7",
        snapshotContent: {
          title: "자취 요리 레시피 모음",
          icon: "🍳",
          coverImage: null,
          updatedAt: "2026-05-06T18:10:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-9",
          name: "Petal",
          email: "petal@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-startup",
        title: "사이드 프로젝트 런칭 체크리스트",
        description: "개인 프로젝트를 처음 세상에 내놓기 전 반드시 확인해야 할 항목들을 정리했습니다. 도메인, SEO, OG 태그, 에러 트래킹, 분석 도구 설치, 약관 및 개인정보처리방침까지 빠진 항목이 없도록 구성했습니다.",
        tags: ["startup", "checklist", "launch"],
        likeCount: 29,
        createdAt: "2026-04-28T09:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-12",
        workspaceId: "demo-workspace-8",
        snapshotContent: {
          title: "사이드 프로젝트 런칭 체크리스트",
          icon: "🚀",
          coverImage: null,
          updatedAt: "2026-04-28T08:40:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-10",
          name: "Grove",
          email: "grove@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-mindmap",
        title: "2026 목표 마인드맵",
        description: "올해 이루고 싶은 목표를 Clearing 캔버스에 시각화한 snapshot입니다.",
        tags: ["goal", "canvas", "mindmap"],
        likeCount: 18,
        createdAt: "2026-04-20T11:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.CANVAS,
        pageId: "demo-page-13",
        workspaceId: "demo-workspace-5",
        snapshotContent: {
          title: "2026 목표 마인드맵",
          icon: null,
          coverImage: null,
          updatedAt: "2026-04-20T10:30:00.000Z",
          pageType: "canvas",
          content: { version: 2, layers: [] },
        },
        user: {
          id: "demo-user-7",
          name: "Reed",
          email: "reed@obnofi.local",
          image: null,
        },
      }),
      createMockPublishedSnapshotRow({
        id: "forest-demo-lang",
        title: "영어 공부법 정리",
        description: "쉐도잉, 영화 스크립트 분석, 단어장 앱 비교까지 2년간 시도해본 영어 공부 방법들의 장단점을 솔직하게 적었습니다. 결론적으로 꾸준히 지속 가능한 방법만 남겼습니다.",
        tags: ["english", "study", "language"],
        likeCount: 52,
        createdAt: "2026-04-12T14:00:00.000Z",
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.PAGE,
        pageId: "demo-page-14",
        workspaceId: "demo-workspace-9",
        snapshotContent: {
          title: "영어 공부법 정리",
          icon: "📖",
          coverImage: null,
          updatedAt: "2026-04-12T13:45:00.000Z",
          pageType: "document",
          content: { type: "doc", content: [] },
        },
        user: {
          id: "demo-user-11",
          name: "Twig",
          email: "twig@obnofi.local",
          image: null,
        },
      }),
    ];
  }

  return globalForPublishedPages.__obnofiPublishedPagesMockStoreV2;
}

function getActiveMockRows() {
  return getMockPublishedPagesStore().filter((row) => !row.deletedAt);
}

function getMockPublishedSnapshotSummary(
  row: PublishedSnapshotRow,
  viewerUserId?: string | null
) {
  return toPublishedSnapshotSummary(
    {
      id: row.id,
      title: row.title,
      description: row.description,
      tags: row.tags,
      likeCount: row.likeCount,
      createdAt: row.createdAt,
      snapshotType: row.snapshotType,
      pageId: row.pageId,
      workspaceId: row.workspaceId,
      user: row.user,
      likes: row.likes,
    },
    viewerUserId
  );
}

function normalizeTags(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const rawTag of input) {
    if (typeof rawTag !== "string") {
      continue;
    }
    const normalized = rawTag.trim().toLowerCase();
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    tags.push(normalized);
    if (tags.length >= MAX_TAGS) {
      break;
    }
  }

  return tags;
}

export function validatePublishedSnapshotInput(description: unknown, tags: unknown) {
  if (typeof description !== "string" || !description.trim()) {
    return "description is required";
  }

  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    return `description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`;
  }

  const normalizedTags = normalizeTags(tags);
  if (Array.isArray(tags) && normalizedTags.length !== tags.filter((tag) => typeof tag === "string" && tag.trim()).length) {
    // Duplicates and empty values are normalized away. That is allowed.
  }

  if (Array.isArray(tags) && tags.length > MAX_TAGS) {
    return `tags must contain at most ${MAX_TAGS} items`;
  }

  return null;
}

function resolveAuthorName(user: { name: string | null; email: string; image: string | null; id: string }) {
  const fallback = user.email.split("@")[0]?.trim();
  return {
    id: user.id,
    name: user.name?.trim() || fallback || "anonymous",
    image: user.image ?? null,
  };
}

function fromPrismaPublishedSnapshotType(value: PersistedPublishedSnapshotType): PublishedSnapshotType {
  return value.toLowerCase() as PublishedSnapshotType;
}

function toPublishedSnapshotSummary(
  row: {
    id: string;
    title: string;
    description: string;
    tags: string[];
    likeCount: number;
    createdAt: Date;
    snapshotType: PersistedPublishedSnapshotType;
    pageId: string | null;
    workspaceId: string | null;
    user: { id: string; name: string | null; email: string; image: string | null };
    likes?: Array<{ userId: string }>;
  },
  viewerUserId?: string | null
): PublishedSnapshotSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    tags: row.tags,
    likeCount: row.likeCount,
    createdAt: row.createdAt.toISOString(),
    snapshotType: fromPrismaPublishedSnapshotType(row.snapshotType),
    author: resolveAuthorName(row.user),
    pageId: row.pageId,
    workspaceId: row.workspaceId,
    viewerHasLiked: Boolean(viewerUserId && row.likes?.some((like) => like.userId === viewerUserId)),
  };
}

export async function getActivePublicationForPage(
  userId: string,
  pageId: string
): Promise<PublishedSnapshotManageResponse> {
  const runMock = () => {
    const publication = getActiveMockRows()
      .filter((row) => row.userId === userId && row.pageId === pageId)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .find((row) =>
        row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.PAGE ||
        row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.CANVAS
      );

    return {
      publication: publication ? getMockPublishedSnapshotSummary(publication, userId) : null,
    };
  };

  if (!hasPublishedPagesRuntime()) {
    return runMock();
  }

  return withPublishedPagesFallback(async () => {
    const publication = await prisma.publishedPage.findFirst({
      where: {
        userId,
        pageId,
        deletedAt: null,
        snapshotType: { in: [PUBLISHED_SNAPSHOT_TYPE.PAGE, PUBLISHED_SNAPSHOT_TYPE.CANVAS] },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        likeCount: true,
        createdAt: true,
        snapshotType: true,
        pageId: true,
        workspaceId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        likes: { select: { userId: true }, where: { userId } },
      },
    });

    return {
      publication: publication ? toPublishedSnapshotSummary(publication, userId) : null,
    };
  }, runMock);
}

export async function getActiveGraphPublicationForWorkspace(
  userId: string,
  workspaceId: string
): Promise<PublishedSnapshotManageResponse> {
  const runMock = () => {
    const publication = getActiveMockRows()
      .filter(
        (row) =>
          row.userId === userId &&
          row.workspaceId === workspaceId &&
          row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.GRAPH
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())[0];

    return {
      publication: publication ? getMockPublishedSnapshotSummary(publication, userId) : null,
    };
  };

  if (!hasPublishedPagesRuntime()) {
    return runMock();
  }

  return withPublishedPagesFallback(async () => {
    const publication = await prisma.publishedPage.findFirst({
      where: {
        userId,
        workspaceId,
        deletedAt: null,
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        likeCount: true,
        createdAt: true,
        snapshotType: true,
        pageId: true,
        workspaceId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        likes: { select: { userId: true }, where: { userId } },
      },
    });

    return {
      publication: publication ? toPublishedSnapshotSummary(publication, userId) : null,
    };
  }, runMock);
}

export async function listPublishedSnapshots(options: {
  sort?: "latest" | "popular";
  tag?: string | null;
  viewerUserId?: string | null;
}): Promise<PublishedSnapshotSummary[]> {
  const runMock = () => {
    const tag = options.tag?.toLowerCase() ?? null;
    const rows = getActiveMockRows()
      .filter((row) => (tag ? row.tags.includes(tag) : true))
      .sort((left, right) => {
        if (options.sort === "popular" && right.likeCount !== left.likeCount) {
          return right.likeCount - left.likeCount;
        }
        return right.createdAt.getTime() - left.createdAt.getTime();
      })
      .slice(0, 100);

    return rows.map((row) => getMockPublishedSnapshotSummary(row, options.viewerUserId));
  };

  if (!hasPublishedPagesRuntime()) {
    return runMock();
  }

  return withPublishedPagesFallback(async () => {
    const rows = await prisma.publishedPage.findMany({
      where: {
        deletedAt: null,
        ...(options.tag ? { tags: { has: options.tag.toLowerCase() } } : {}),
      },
      orderBy:
        options.sort === "popular"
          ? [{ likeCount: "desc" }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        likeCount: true,
        createdAt: true,
        snapshotType: true,
        pageId: true,
        workspaceId: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        likes: options.viewerUserId
          ? { where: { userId: options.viewerUserId }, select: { userId: true } }
          : false,
      },
    });

    if (rows.length === 0) {
      const publishedCount = await prisma.publishedPage.count({
        where: { deletedAt: null },
      });
      if (publishedCount === 0) {
        return runMock();
      }
    }

    return rows.map((row) => toPublishedSnapshotSummary(row, options.viewerUserId));
  }, runMock);
}

export async function getPublishedSnapshotDetail(
  publishId: string,
  viewerUserId?: string | null
): Promise<PublishedSnapshotDetail | null> {
  const runMock = () => {
    const row = getActiveMockRows().find((item) => item.id === publishId);
    if (!row) {
      return null;
    }

    return {
      ...getMockPublishedSnapshotSummary(row, viewerUserId),
      snapshotContent: row.snapshotContent,
    };
  };

  if (!hasPublishedPagesRuntime()) {
    return runMock();
  }

  return withPublishedPagesFallback(async () => {
    const row = await prisma.publishedPage.findFirst({
      where: { id: publishId, deletedAt: null },
      select: {
        id: true,
        title: true,
        description: true,
        tags: true,
        likeCount: true,
        createdAt: true,
        snapshotType: true,
        pageId: true,
        workspaceId: true,
        snapshotContent: true,
        user: { select: { id: true, name: true, email: true, image: true } },
        likes: viewerUserId
          ? { where: { userId: viewerUserId }, select: { userId: true } }
          : false,
      },
    });

    if (!row) {
      const publishedCount = await prisma.publishedPage.count({
        where: { deletedAt: null },
      });
      if (publishedCount === 0) {
        return runMock();
      }
      return null;
    }

    return {
      ...toPublishedSnapshotSummary(row, viewerUserId),
      snapshotContent: row.snapshotContent as unknown as PublishedPageSnapshotContent | PublishedGraphSnapshotContent,
    };
  }, runMock);
}

export async function createPagePublication(options: {
  userId: string;
  pageId: string;
  description: string;
  tags: string[];
}) {
  const page = await prisma.page.findFirst({
    where: { id: options.pageId },
    select: {
      id: true,
      title: true,
      icon: true,
      coverImage: true,
      content: true,
      type: true,
      workspaceId: true,
      updatedAt: true,
      yjsDocument: { select: { state: true, updatedAt: true } },
    },
  });

  if (!page) {
    throw new Error("PAGE_NOT_FOUND");
  }

  const snapshotType =
    page.type === "CANVAS"
      ? PUBLISHED_SNAPSHOT_TYPE.CANVAS
      : PUBLISHED_SNAPSHOT_TYPE.PAGE;
  const latestContent =
    page.type === "DOCUMENT"
      ? resolvePersistedYjsContent(page.yjsDocument?.state) ?? (page.content as object | null)
      : (page.content as object | null);
  const latestUpdatedAt =
    page.yjsDocument?.updatedAt &&
    page.yjsDocument.updatedAt.getTime() > page.updatedAt.getTime()
      ? page.yjsDocument.updatedAt
      : page.updatedAt;

  const snapshotContent: PublishedPageSnapshotContent = {
    title: page.title,
    icon: page.icon ?? null,
    coverImage: page.coverImage ?? null,
    content: latestContent ?? null,
    updatedAt: latestUpdatedAt.toISOString(),
    pageType: page.type.toLowerCase() as PublishedPageSnapshotContent["pageType"],
  };

  if (!hasPublishedPagesRuntime()) {
    const store = getMockPublishedPagesStore();
    const deletedAt = new Date();
    for (const row of store) {
      if (row.userId === options.userId && row.pageId === options.pageId && !row.deletedAt) {
        row.deletedAt = deletedAt;
      }
    }

    const created: PublishedSnapshotRow = {
      id: `mock-publish-${Date.now()}`,
      userId: options.userId,
      pageId: page.id,
      workspaceId: page.workspaceId,
      snapshotType,
      snapshotContent,
      title: page.title,
      description: options.description.trim(),
      tags: normalizeTags(options.tags),
      likeCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      user: {
        id: options.userId,
        name: "You",
        email: "you@obnofi.local",
        image: null,
      },
      likes: [],
    };
    store.unshift(created);

    return getMockPublishedSnapshotSummary(created, options.userId);
  }

  return withPublishedPagesFallback(
    () =>
      prisma.$transaction(async (tx) => {
        await tx.publishedPage.updateMany({
          where: {
            userId: options.userId,
            pageId: options.pageId,
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });

        const created = await tx.publishedPage.create({
          data: {
            userId: options.userId,
            pageId: page.id,
            workspaceId: page.workspaceId,
            snapshotType,
            snapshotContent: snapshotContent as unknown as Prisma.InputJsonValue,
            title: page.title,
            description: options.description.trim(),
            tags: normalizeTags(options.tags),
          },
          select: {
            id: true,
            title: true,
            description: true,
            tags: true,
            likeCount: true,
            createdAt: true,
            snapshotType: true,
            pageId: true,
            workspaceId: true,
            user: { select: { id: true, name: true, email: true, image: true } },
            likes: { where: { userId: options.userId }, select: { userId: true } },
          },
        });

        return toPublishedSnapshotSummary(created, options.userId);
      }),
    () => {
      const store = getMockPublishedPagesStore();
      const deletedAt = new Date();
      for (const row of store) {
        if (row.userId === options.userId && row.pageId === options.pageId && !row.deletedAt) {
          row.deletedAt = deletedAt;
        }
      }

      const created: PublishedSnapshotRow = {
        id: `mock-publish-${Date.now()}`,
        userId: options.userId,
        pageId: page.id,
        workspaceId: page.workspaceId,
        snapshotType,
        snapshotContent,
        title: page.title,
        description: options.description.trim(),
        tags: normalizeTags(options.tags),
        likeCount: 0,
        createdAt: new Date(),
        deletedAt: null,
        user: {
          id: options.userId,
          name: "You",
          email: "you@obnofi.local",
          image: null,
        },
        likes: [],
      };
      store.unshift(created);

      return getMockPublishedSnapshotSummary(created, options.userId);
    }
  );
}

export async function createGraphPublication(options: {
  userId: string;
  workspaceId: string;
  focusedPageId: string | null;
  description: string;
  tags: string[];
}) {
  const prismaPages = await prisma.page.findMany({
    where: { workspaceId: options.workspaceId, parentDatabaseId: null },
    select: PAGE_GRAPH_SELECT,
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
  });

  const pages = prismaPages.map(toPage);
  const graphData = createGraphFromPages(pages, options.focusedPageId);
  const snapshotContent: PublishedGraphSnapshotContent = {
    workspaceId: options.workspaceId,
    focusedPageId: options.focusedPageId,
    nodes: graphData.allNodes,
    edges: graphData.allEdges as unknown as Record<string, unknown>[],
  };

  const focusPage = options.focusedPageId
    ? pages.find((page) => page.id === options.focusedPageId)
    : null;
  const title = focusPage ? `${focusPage.title || "Untitled"} Graph View` : "Workspace Graph View";

  if (!hasPublishedPagesRuntime()) {
    const store = getMockPublishedPagesStore();
    const deletedAt = new Date();
    for (const row of store) {
      if (
        row.userId === options.userId &&
        row.workspaceId === options.workspaceId &&
        row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.GRAPH &&
        !row.deletedAt
      ) {
        row.deletedAt = deletedAt;
      }
    }

    const created: PublishedSnapshotRow = {
      id: `mock-publish-${Date.now()}`,
      userId: options.userId,
      workspaceId: options.workspaceId,
      pageId: options.focusedPageId,
      snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
      snapshotContent,
      title,
      description: options.description.trim(),
      tags: normalizeTags(options.tags),
      likeCount: 0,
      createdAt: new Date(),
      deletedAt: null,
      user: {
        id: options.userId,
        name: "You",
        email: "you@obnofi.local",
        image: null,
      },
      likes: [],
    };
    store.unshift(created);

    return getMockPublishedSnapshotSummary(created, options.userId);
  }

  return withPublishedPagesFallback(
    () =>
      prisma.$transaction(async (tx) => {
        await tx.publishedPage.updateMany({
          where: {
            userId: options.userId,
            workspaceId: options.workspaceId,
            snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
            deletedAt: null,
          },
          data: { deletedAt: new Date() },
        });

        const created = await tx.publishedPage.create({
          data: {
            userId: options.userId,
            workspaceId: options.workspaceId,
            pageId: options.focusedPageId,
            snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
            snapshotContent: snapshotContent as unknown as Prisma.InputJsonValue,
            title,
            description: options.description.trim(),
            tags: normalizeTags(options.tags),
          },
          select: {
            id: true,
            title: true,
            description: true,
            tags: true,
            likeCount: true,
            createdAt: true,
            snapshotType: true,
            pageId: true,
            workspaceId: true,
            user: { select: { id: true, name: true, email: true, image: true } },
            likes: { where: { userId: options.userId }, select: { userId: true } },
          },
        });

        return toPublishedSnapshotSummary(created, options.userId);
      }),
    () => {
      const store = getMockPublishedPagesStore();
      const deletedAt = new Date();
      for (const row of store) {
        if (
          row.userId === options.userId &&
          row.workspaceId === options.workspaceId &&
          row.snapshotType === PUBLISHED_SNAPSHOT_TYPE.GRAPH &&
          !row.deletedAt
        ) {
          row.deletedAt = deletedAt;
        }
      }

      const created: PublishedSnapshotRow = {
        id: `mock-publish-${Date.now()}`,
        userId: options.userId,
        workspaceId: options.workspaceId,
        pageId: options.focusedPageId,
        snapshotType: PUBLISHED_SNAPSHOT_TYPE.GRAPH,
        snapshotContent,
        title,
        description: options.description.trim(),
        tags: normalizeTags(options.tags),
        likeCount: 0,
        createdAt: new Date(),
        deletedAt: null,
        user: {
          id: options.userId,
          name: "You",
          email: "you@obnofi.local",
          image: null,
        },
        likes: [],
      };
      store.unshift(created);

      return getMockPublishedSnapshotSummary(created, options.userId);
    }
  );
}

export async function softDeletePublication(publishId: string, userId: string) {
  if (!hasPublishedPagesRuntime()) {
    const row = getMockPublishedPagesStore().find(
      (item) => item.id === publishId && item.userId === userId && !item.deletedAt
    );
    if (!row) {
      return false;
    }
    row.deletedAt = new Date();
    return true;
  }

  return withPublishedPagesFallback(async () => {
    const updated = await prisma.publishedPage.updateMany({
      where: { id: publishId, userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return updated.count > 0;
  }, () => {
    const row = getMockPublishedPagesStore().find(
      (item) => item.id === publishId && item.userId === userId && !item.deletedAt
    );
    if (!row) {
      return false;
    }
    row.deletedAt = new Date();
    return true;
  });
}

export async function togglePublicationLike(publishId: string, userId: string, shouldLike: boolean) {
  if (!hasPublishedPagesRuntime()) {
    const row = getActiveMockRows().find((item) => item.id === publishId);
    if (!row) {
      return null;
    }

    const hasLike = row.likes.some((like) => like.userId === userId);
    if (shouldLike && !hasLike) {
      row.likes.push({ userId });
    }
    if (!shouldLike && hasLike) {
      row.likes = row.likes.filter((like) => like.userId !== userId);
    }
    row.likeCount = row.likes.length;

    return {
      ...getMockPublishedSnapshotSummary(row, userId),
      snapshotContent: row.snapshotContent,
    };
  }

  return withPublishedPagesFallback(async () => {
    const publication = await prisma.publishedPage.findFirst({
      where: { id: publishId, deletedAt: null },
      select: { id: true },
    });

    if (!publication) {
      return null;
    }

    await prisma.$transaction(async (tx) => {
      if (shouldLike) {
        await tx.publishedPageLike.upsert({
          where: {
            userId_publishedPageId: {
              userId,
              publishedPageId: publishId,
            },
          },
          update: {},
          create: {
            userId,
            publishedPageId: publishId,
          },
        });
      } else {
        await tx.publishedPageLike.deleteMany({
          where: {
            userId,
            publishedPageId: publishId,
          },
        });
      }

      const likeCount = await tx.publishedPageLike.count({
        where: { publishedPageId: publishId },
      });

      await tx.publishedPage.update({
        where: { id: publishId },
        data: { likeCount },
      });
    });

    return getPublishedSnapshotDetail(publishId, userId);
  }, () => {
    const row = getActiveMockRows().find((item) => item.id === publishId);
    if (!row) {
      return null;
    }

    const hasLike = row.likes.some((like) => like.userId === userId);
    if (shouldLike && !hasLike) {
      row.likes.push({ userId });
    }
    if (!shouldLike && hasLike) {
      row.likes = row.likes.filter((like) => like.userId !== userId);
    }
    row.likeCount = row.likes.length;

    return {
      ...getMockPublishedSnapshotSummary(row, userId),
      snapshotContent: row.snapshotContent,
    };
  });
}

export async function canUserAccessPage(userId: string, pageId: string) {
  const page = await prisma.page.findFirst({
    where: {
      id: pageId,
      workspace: {
        members: {
          some: { userId },
        },
      },
    },
    select: { id: true, workspaceId: true },
  });

  return page;
}

export async function canUserAccessWorkspace(userId: string, workspaceId: string) {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      members: {
        some: { userId },
      },
    },
    select: { id: true },
  });

  return workspace;
}

export async function listForestTags() {
  if (!hasPublishedPagesRuntime()) {
    return Array.from(
      new Set(getActiveMockRows().flatMap((row) => row.tags).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }

  return withPublishedPagesFallback(async () => {
    const rows = await prisma.publishedPage.findMany({
      where: { deletedAt: null },
      select: { tags: true },
      take: 200,
    });

    if (rows.length === 0) {
      return Array.from(
        new Set(getActiveMockRows().flatMap((row) => row.tags).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b));
    }

    return Array.from(
      new Set(rows.flatMap((row) => row.tags).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, () =>
    Array.from(
      new Set(getActiveMockRows().flatMap((row) => row.tags).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b))
  );
}

export { normalizeTags };
