import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { toEnvelope } from 'src/common/dto/api-envelope.dto';
import { UpsertLlmCredentialDto } from 'src/llm/dto/upsert-llm-credential.dto';
import { LlmCatalogService } from 'src/llm/llm-catalog.service';
import { LlmCredentialsService } from 'src/llm/llm-credentials.service';

@ApiTags('llm')
@Controller('llm')
export class LlmController {
  constructor(
    private readonly credentialsService: LlmCredentialsService,
    private readonly catalogService: LlmCatalogService,
  ) {}

  @Get('credentials')
  async listCredentials(@CurrentUserId() userId: string) {
    return toEnvelope(await this.credentialsService.listCredentialSummaries(userId));
  }

  @Put('credentials/:provider')
  async upsertCredential(
    @CurrentUserId() userId: string,
    @Param('provider') provider: string,
    @Body() payload: UpsertLlmCredentialDto,
  ) {
    return toEnvelope(
      await this.credentialsService.upsertCredential(
        userId,
        this.credentialsService.parseManagedProvider(provider),
        payload.apiKey,
      ),
    );
  }

  @Delete('credentials/:provider')
  async deleteCredential(@CurrentUserId() userId: string, @Param('provider') provider: string) {
    return toEnvelope(
      await this.credentialsService.deleteCredential(
        userId,
        this.credentialsService.parseManagedProvider(provider),
      ),
    );
  }

  @Get('catalog')
  async getCatalog(@CurrentUserId() userId: string) {
    return toEnvelope(await this.catalogService.getAllCatalogs(userId));
  }

  @Get('catalog/:provider')
  async getCatalogByProvider(@CurrentUserId() userId: string, @Param('provider') provider: string) {
    return toEnvelope(
      await this.catalogService.getCatalog(
        userId,
        this.credentialsService.parseManagedProvider(provider),
      ),
    );
  }
}
