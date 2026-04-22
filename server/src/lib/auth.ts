import { FastifyRequest, FastifyReply } from "fastify";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { prisma } from "./prisma.js";

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET;

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

// NextAuth.js JWT 디코딩 (대칭 키 사용)
async function verifyNextAuthToken(token: string, secret: string): Promise<any | null> {
  try {
    // NextAuth.js는 기본적으로 HS256 알고리즘과 A256GCM 암호화를 사용합니다
    // 하지만 jose로 직접 검증하려면 먼저 토큰 구조를 파악해야 합니다
    
    // 토큰을 parts로 분리
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }
    
    // Base64URL 디코딩
    const decodeBase64URL = (str: string) => {
      const padding = "=".repeat((4 - (str.length % 4)) % 4);
      const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + padding;
      return Buffer.from(base64, "base64").toString("utf-8");
    };
    
    // 헤더와 페이로드 디코딩 (NextAuth.js JWT는 JWE 형식일 수 있음)
    // 간단한 JWT 형식만 지원 (JWS)
    const payload = JSON.parse(decodeBase64URL(parts[1]));
    
    // 서명 검증을 위한 키 생성
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    
    // JWT 검증
    const { payload: verifiedPayload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    
    return verifiedPayload;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<boolean> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.status(401).send({ error: "Unauthorized: Missing or invalid token" });
    return false;
  }

  const token = authHeader.substring(7);

  try {
    // JWT 검증
    const decoded = await verifyNextAuthToken(token, NEXTAUTH_SECRET!);

    if (!decoded || !decoded.sub) {
      reply.status(401).send({ error: "Unauthorized: Invalid token" });
      return false;
    }

    // 사용자 정보 조회
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub as string },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      reply.status(401).send({ error: "Unauthorized: User not found" });
      return false;
    }

    request.user = user;
    return true;
  } catch (error) {
    console.error("Auth error:", error);
    reply.status(401).send({ error: "Unauthorized: Token verification failed" });
    return false;
  }
}
