import { Module } from '@nestjs/common';

import { LlmController } from 'src/llm/llm.controller';
import { LlmCatalogService } from 'src/llm/llm-catalog.service';
import { LlmCredentialsService } from 'src/llm/llm-credentials.service';
import { LlmCryptoService } from 'src/llm/llm-crypto.service';
import { LlmRepository } from 'src/llm/llm.repository';

@Module({
  controllers: [LlmController],
  providers: [LlmRepository, LlmCryptoService, LlmCredentialsService, LlmCatalogService],
  exports: [LlmCredentialsService, LlmCatalogService],
})
export class LlmModule {}
