ALTER TABLE "Page"
ADD COLUMN "highlightColors" TEXT[] NOT NULL DEFAULT ARRAY['yellow', 'green', 'blue', 'pink']::TEXT[];
