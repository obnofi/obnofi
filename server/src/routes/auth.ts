import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../lib/auth.js";
import { prisma } from "../lib/prisma.js";

export async function authRoutes(server: FastifyInstance) {
  // GET /auth/me - 현재 사용자 정보 반환
  server.get("/me", async (request: FastifyRequest, reply: FastifyReply) => {
    const isAuthenticated = await authenticateRequest(request, reply);
    if (!isAuthenticated) return;

    const user = await prisma.user.findUnique({
      where: { id: request.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
        preferences: true,
        ownedWorkspaces: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    return reply.send({ user });
  });
}
