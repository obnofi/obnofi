import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@obnofi/db";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { isProfileImagePreset, pickProfileImagePreset } from "@/lib/profileImagePresets";

const googleClientId =
  process.env.GOOGLE_CLIENT_ID ??
  process.env.AUTH_GOOGLE_ID ??
  "temp-client-id";

const googleClientSecret =
  process.env.GOOGLE_CLIENT_SECRET ??
  process.env.AUTH_GOOGLE_SECRET ??
  "temp-client-secret";

async function ensureUserProfileImage(userId: string, fallbackSeed: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { image: true },
  });

  const seededProfileImage = pickProfileImagePreset(fallbackSeed);

  if (isProfileImagePreset(user?.image)) {
    return user.image;
  }

  if (!user) {
    return seededProfileImage;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { image: seededProfileImage },
  });

  return seededProfileImage;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      allowDangerousEmailAccountLinking: true,
      httpOptions: {
        timeout: 15000,
      },
    }),
    // 임시 개발용: credentials 로그인
    CredentialsProvider({
      name: "Development",
      credentials: {},
      async authorize() {
        // Credentials provider는 adapter와 함께 써도 Account 레코드를 생성하지 않으므로
        // User를 직접 upsert한다.
        const user = await prisma.user.upsert({
          where: { email: "dev@obnofi.com" },
          update: {
            image: pickProfileImagePreset("dev-user-1"),
          },
          create: {
            id: "dev-user-1",
            name: "Developer",
            email: "dev@obnofi.com",
            image: pickProfileImagePreset("dev-user-1"),
          },
        });
        return user;
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.image = await ensureUserProfileImage(
          token.sub,
          token.email ?? session.user.email ?? token.sub
        );
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.picture = pickProfileImagePreset(user.email ?? user.id);
      }
      return token;
    },
    async signIn({ user }) {
      const userId = "id" in user && typeof user.id === "string" ? user.id : null;

      if (userId) {
        await ensureUserProfileImage(userId, user.email ?? userId);
      }

      return true;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
};
