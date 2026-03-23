import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { toEnvelope } from 'src/common/dto/api-envelope.dto';
import { AddAgentDto } from 'src/agents/dto/add-agent.dto';
import { ReorderAgentsDto } from 'src/agents/dto/reorder-agents.dto';
import { UpdateAgentDto } from 'src/agents/dto/update-agent.dto';
import { AgentsService } from 'src/agents/agents.service';

@ApiTags('agents')
@Controller('topics/:topicId/agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  async addAgent(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Body() payload: AddAgentDto,
  ) {
    return toEnvelope(await this.agentsService.addAgent(topicId, userId, payload));
  }

  @Patch(':agentId')
  async updateAgent(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Param('agentId') agentId: string,
    @Body() payload: UpdateAgentDto,
  ) {
    return toEnvelope(await this.agentsService.updateAgent(topicId, agentId, userId, payload));
  }

  @Delete(':agentId')
  async deleteAgent(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Param('agentId') agentId: string,
  ) {
    return toEnvelope(await this.agentsService.deleteAgent(topicId, agentId, userId));
  }

  @Post('reorder')
  async reorderAgents(
    @CurrentUserId() userId: string,
    @Param('topicId') topicId: string,
    @Body() payload: ReorderAgentsDto,
  ) {
    return toEnvelope(await this.agentsService.reorderAgents(topicId, userId, payload));
  }
}
