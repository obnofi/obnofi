import type { FastifyInstance } from "fastify";
import { setupWSConnection } from "y-websocket/bin/utils";

// ws://server/ws/:pageId
// pageId 가 Yjs document name 역할을 함
export function registerWsRoutes(app: FastifyInstance) {
  app.get("/ws/:pageId", { websocket: true }, (socket, req) => {
    const { pageId } = req.params as { pageId: string };

    // TODO: JWT 검증 — req.headers.authorization 확인 후 거부
    // const token = req.headers.authorization?.split(" ")[1]
    // if (!verifyToken(token)) return socket.close(4401, "Unauthorized")

    setupWSConnection(socket, req, { docName: pageId });
  });
}
