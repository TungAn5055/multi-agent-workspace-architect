import { Module } from '@nestjs/common';

import { AgentsController } from 'src/agents/agents.controller';
import { AgentsRepository } from 'src/agents/agents.repository';
import { AgentsService } from 'src/agents/agents.service';
import { TopicsModule } from 'src/topics/topics.module';

@Module({
  imports: [TopicsModule],
  controllers: [AgentsController],
  providers: [AgentsRepository, AgentsService],
  exports: [AgentsRepository, AgentsService],
})
export class AgentsModule {}
