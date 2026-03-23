import { Module } from '@nestjs/common';

import { LlmGatewayService } from 'src/llm-gateway/llm-gateway.service';

@Module({
  providers: [LlmGatewayService],
  exports: [LlmGatewayService],
})
export class LlmGatewayModule {}
