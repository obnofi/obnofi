-- AlterTable: Page에 공동 편집 설정 필드 추가
ALTER TABLE "Page" ADD COLUMN "collaborationEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Page" ADD COLUMN "lineIndicatorEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateEnum: CollabRole
CREATE TYPE "CollabRole" AS ENUM ('EDITOR', 'VIEWER');

-- CreateTable: PageCollaborator
CREATE TABLE "PageCollaborator" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "CollabRole" NOT NULL DEFAULT 'EDITOR',
    "invitedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PageCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageCollaborator_pageId_userId_key" ON "PageCollaborator"("pageId", "userId");
CREATE INDEX "PageCollaborator_userId_idx" ON "PageCollaborator"("userId");

-- AddForeignKey
ALTER TABLE "PageCollaborator" ADD CONSTRAINT "PageCollaborator_pageId_fkey"
    FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PageCollaborator" ADD CONSTRAINT "PageCollaborator_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
