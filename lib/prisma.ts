// 임시: Prisma 없이 동작하도록 mock
export const prisma = {
  user: {
    findUnique: async () => null,
    findFirst: async () => null,
    create: async (data: any) => ({ id: "temp-user-id", ...data.data }),
  },
  workspace: {
    findFirst: async () => null,
    create: async (data: any) => ({ id: "temp-workspace-id", ...data.data }),
  },
} as any;
