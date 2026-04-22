import { FastifyInstance } from "fastify";
import { authRoutes } from "./auth.js";
import { notesRoutes } from "./notes.js";
import { dbDiagramRoutes } from "./db-diagram.js";
import { feedRoutes } from "./feed.js";

export async function registerRoutes(server: FastifyInstance) {
  // Auth routes
  await server.register(authRoutes, { prefix: "/auth" });

  // Notes routes
  await server.register(notesRoutes, { prefix: "/notes" });

  // DB Diagram routes
  await server.register(dbDiagramRoutes, { prefix: "/blocks/db-diagram" });

  // Feed routes
  await server.register(feedRoutes, { prefix: "/feed" });
}
