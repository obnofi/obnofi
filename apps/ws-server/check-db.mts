import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const pages = await prisma.page.findMany({ where: { collaborationEnabled: true }, select: { id: true, title: true }, take: 5 });
const collaborators = await prisma.pageCollaborator.findMany({ take: 5, select: { pageId: true, userId: true } });
console.log('Collab pages:', JSON.stringify(pages));
console.log('Collaborators:', JSON.stringify(collaborators));
await prisma.$disconnect();
