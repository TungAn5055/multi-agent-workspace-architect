import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PhaseTwoSchemaService {
  private ensurePromise: Promise<void> | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async ensureSchema() {
    if (!this.ensurePromise) {
      this.ensurePromise = this.ensureSchemaInternal().catch((error) => {
        this.ensurePromise = null;
        throw error;
      });
    }

    return this.ensurePromise;
  }

  private async ensureSchemaInternal() {
    await this.prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        CREATE TYPE "LlmProvider" AS ENUM ('openai', 'anthropic', 'openrouter');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END
      $$;
    `);

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "topics"
      ADD COLUMN IF NOT EXISTS "shared_provider" "LlmProvider" NOT NULL DEFAULT 'openrouter';
    `);

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "topic_agents"
      ADD COLUMN IF NOT EXISTS "provider" "LlmProvider";
    `);

    await this.prisma.$executeRawUnsafe(`
      ALTER TABLE "topic_agents"
      ADD COLUMN IF NOT EXISTS "model" TEXT;
    `);

    await this.prisma.$executeRawUnsafe(`
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
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "user_llm_credentials_user_id_provider_key"
      ON "user_llm_credentials"("user_id", "provider");
    `);

    await this.prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "user_llm_credentials_user_id_idx"
      ON "user_llm_credentials"("user_id");
    `);
  }
}
