import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

interface QueryParams {
  limit?: string;
  search?: string;
}

interface NoteParams {
  id: string;
}

interface CreateNoteBody {
  title?: string;
  content?: any;
  workspaceId: string;
}

interface UpdateNoteBody {
  title?: string;
  content?: any;
}

export async function notesRoutes(server: FastifyInstance) {
  // 인증 미들웨어 적용
  server.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAuthenticated = await authenticateRequest(request, reply);
    if (!isAuthenticated) return;
  });

  // GET /notes?limit=&search= - 노트 목록 조회
  server.get("/", async (request: FastifyRequest<{ Querystring: QueryParams }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const limit = Math.min(parseInt(request.query.limit || "20"), 100);
    const search = request.query.search;

    // 사용자가 접근할 수 있는 워크스페이스 ID 목록 조회
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      select: { workspaceId: true },
    });
    const ownedWorkspaces = await prisma.workspace.findMany({
      where: { ownerId: userId },
      select: { id: true },
    });

    const workspaceIds = [
      ...memberships.map((m) => m.workspaceId),
      ...ownedWorkspaces.map((w) => w.id),
    ];

    const where: any = {
      workspaceId: { in: workspaceIds },
      type: "DOCUMENT",
    };

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    const notes = await prisma.page.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        workspaceId: true,
        icon: true,
      },
    });

    return reply.send({ notes });
  });

  // POST /notes - 새 노트 생성
  server.post("/", async (request: FastifyRequest<{ Body: CreateNoteBody }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { title, content, workspaceId } = request.body;

    // 워크스페이스 접근 권한 확인
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!workspace) {
      return reply.status(403).send({ error: "Access denied to workspace" });
    }

    const note = await prisma.page.create({
      data: {
        title: title || "Untitled",
        content: content || {},
        workspaceId,
        type: "DOCUMENT",
        createdBy: userId,
        lastEditedBy: userId,
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        workspaceId: true,
      },
    });

    return reply.status(201).send({ note });
  });

  // GET /notes/:id - 특정 노트 조회
  server.get("/:id", async (request: FastifyRequest<{ Params: NoteParams }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;

    const note = await prisma.page.findFirst({
      where: {
        id,
        type: "DOCUMENT",
        workspace: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        workspaceId: true,
        icon: true,
        coverImage: true,
        isPublic: true,
      },
    });

    if (!note) {
      return reply.status(404).send({ error: "Note not found" });
    }

    return reply.send({ note });
  });

  // PATCH /notes/:id - 노트 수정
  server.patch("/:id", async (request: FastifyRequest<{ Params: NoteParams; Body: UpdateNoteBody }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;
    const { title, content } = request.body;

    // 노트 존재 및 접근 권한 확인
    const existingNote = await prisma.page.findFirst({
      where: {
        id,
        type: "DOCUMENT",
        workspace: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
      },
    });

    if (!existingNote) {
      return reply.status(404).send({ error: "Note not found" });
    }

    const updateData: any = {
      lastEditedBy: userId,
    };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const note = await prisma.page.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        workspaceId: true,
        icon: true,
      },
    });

    return reply.send({ note });
  });

  // DELETE /notes/:id - 노트 삭제
  server.delete("/:id", async (request: FastifyRequest<{ Params: NoteParams }>, reply: FastifyReply) => {
    const userId = request.user!.id;
    const { id } = request.params;

    // 노트 존재 및 접근 권한 확인
    const existingNote = await prisma.page.findFirst({
      where: {
        id,
        type: "DOCUMENT",
        workspace: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId, role: { in: ["OWNER", "EDITOR"] } } } },
          ],
        },
      },
    });

    if (!existingNote) {
      return reply.status(404).send({ error: "Note not found or access denied" });
    }

    await prisma.page.delete({
      where: { id },
    });

    return reply.status(204).send();
  });
}
