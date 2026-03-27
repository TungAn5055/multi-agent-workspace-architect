DO $$
BEGIN
  CREATE TYPE "LlmProvider" AS ENUM ('openai', 'anthropic', 'openrouter');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE "topics"
  ADD COLUMN IF NOT EXISTS "shared_provider" "LlmProvider" NOT NULL DEFAULT 'openrouter';

ALTER TABLE "topic_agents"
  ADD COLUMN IF NOT EXISTS "provider" "LlmProvider",
  ADD COLUMN IF NOT EXISTS "model" TEXT;

CREATE TABLE IF NOT EXISTS "user_llm_credentials" (
  "id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" "LlmProvider" NOT NULL,
  "api_key_encrypted" TEXT NOT NULL,
  "key_hint" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "user_llm_credentials_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_llm_credentials_user_id_provider_key"
  ON "user_llm_credentials"("user_id", "provider");

CREATE INDEX IF NOT EXISTS "user_llm_credentials_user_id_idx"
  ON "user_llm_credentials"("user_id");
