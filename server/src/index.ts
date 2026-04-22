import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyWebsocket from "@fastify/websocket";
import { registerWsRoutes } from "./ws/index.js";
import { startCrawlerScheduler } from "./jobs/scheduler.js";
import { registerRoutes } from "./routes/index.js";

async function main() {
  const server = Fastify({ logger: true });

  await server.register(fastifyCors, {
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
  });

  await server.register(fastifyWebsocket);

  // Register HTTP API routes
  await registerRoutes(server);

  registerWsRoutes(server);
  startCrawlerScheduler();

  server.get("/health", async () => ({ status: "ok" }));

  const port = Number(process.env.PORT ?? 4000);
  await server.listen({ port, host: "0.0.0.0" });
  console.log(`obnofi server running on port ${port}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
