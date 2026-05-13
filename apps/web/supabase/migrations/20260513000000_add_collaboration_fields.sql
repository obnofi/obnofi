-- Page 테이블에 공동 편집 설정 필드 추가 (Supabase 동기화용)
-- 실제 스키마는 Prisma에서 관리하지만, Supabase Realtime을 위해 테이블을 구독하려면
-- Realtime publication에 PropertyValue 테이블이 포함되어 있어야 합니다.

-- PropertyValue 테이블을 Realtime publication에 추가
-- (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'PropertyValue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "PropertyValue";
  END IF;
END;
$$;

-- PageCollaborator 테이블은 Prisma 마이그레이션으로 생성됨
-- 여기서는 Supabase 측 Realtime 활성화만 처리
