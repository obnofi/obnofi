import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

function parseEnvValue(rawValue: string) {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadPrismaEnvIfNeeded() {
  if (process.env.DATABASE_URL && process.env.DIRECT_URL) {
    return;
  }

  const candidateDirs: string[] = [];
  let currentDir = process.cwd();

  while (!candidateDirs.includes(currentDir)) {
    candidateDirs.push(currentDir);

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  const candidatePaths = candidateDirs.flatMap((dir) => [
    path.join(dir, ".env.local"),
    path.join(dir, ".env"),
    path.join(dir, "packages/db/.env"),
    path.join(dir, "apps/web/.env.local"),
  ]);

  for (const filePath of candidatePaths) {
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const contents = fs.readFileSync(filePath, "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const normalized = trimmed.startsWith("export ")
        ? trimmed.slice("export ".length)
        : trimmed;
      const separatorIndex = normalized.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = normalized.slice(0, separatorIndex).trim();
      const value = parseEnvValue(normalized.slice(separatorIndex + 1));

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadPrismaEnvIfNeeded();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export * from "@prisma/client";
