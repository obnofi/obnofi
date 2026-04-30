-- CreateTable
CREATE TABLE "YjsDocument" (
    "pageId" TEXT NOT NULL,
    "state" BYTEA NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YjsDocument_pkey" PRIMARY KEY ("pageId")
);

-- AddForeignKey
ALTER TABLE "YjsDocument" ADD CONSTRAINT "YjsDocument_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;
