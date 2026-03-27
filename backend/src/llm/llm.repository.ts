import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import { ManagedLlmProvider } from 'src/config/app.config';
import { PhaseTwoSchemaService } from 'src/prisma/phase-two-schema.service';
import { PrismaService } from 'src/prisma/prisma.service';

interface UserLlmCredentialRecord {
  id: string;
  userId: string;
  provider: ManagedLlmProvider;
  apiKeyEncrypted: string;
  keyHint: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class LlmRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly phaseTwoSchema: PhaseTwoSchemaService,
  ) {}

  async listUserCredentials(userId: string) {
    await this.phaseTwoSchema.ensureSchema();

    return this.prisma.$queryRaw<UserLlmCredentialRecord[]>`
      SELECT
        id,
        user_id AS "userId",
        provider,
        api_key_encrypted AS "apiKeyEncrypted",
        key_hint AS "keyHint",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM user_llm_credentials
      WHERE user_id = ${userId}
      ORDER BY provider ASC
    `;
  }

  async findUserCredential(userId: string, provider: ManagedLlmProvider) {
    await this.phaseTwoSchema.ensureSchema();

    const rows = await this.prisma.$queryRaw<UserLlmCredentialRecord[]>`
      SELECT
        id,
        user_id AS "userId",
        provider,
        api_key_encrypted AS "apiKeyEncrypted",
        key_hint AS "keyHint",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM user_llm_credentials
      WHERE user_id = ${userId} AND provider = ${provider}::"LlmProvider"
      LIMIT 1
    `;

    return rows[0] ?? null;
  }

  async upsertUserCredential(
    userId: string,
    provider: ManagedLlmProvider,
    apiKeyEncrypted: string,
    keyHint: string,
  ) {
    await this.phaseTwoSchema.ensureSchema();

    const rows = await this.prisma.$queryRaw<UserLlmCredentialRecord[]>`
      INSERT INTO user_llm_credentials (
        id,
        user_id,
        provider,
        api_key_encrypted,
        key_hint,
        created_at,
        updated_at
      )
      VALUES (
        ${randomUUID()}::uuid,
        ${userId},
        ${provider}::"LlmProvider",
        ${apiKeyEncrypted},
        ${keyHint},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, provider)
      DO UPDATE SET
        api_key_encrypted = EXCLUDED.api_key_encrypted,
        key_hint = EXCLUDED.key_hint,
        updated_at = NOW()
      RETURNING
        id,
        user_id AS "userId",
        provider,
        api_key_encrypted AS "apiKeyEncrypted",
        key_hint AS "keyHint",
        created_at AS "createdAt",
        updated_at AS "updatedAt"
    `;

    return rows[0]!;
  }

  async deleteUserCredential(userId: string, provider: ManagedLlmProvider) {
    await this.phaseTwoSchema.ensureSchema();

    await this.prisma.$executeRaw`
      DELETE FROM user_llm_credentials
      WHERE user_id = ${userId} AND provider = ${provider}::"LlmProvider"
    `;
  }
}
