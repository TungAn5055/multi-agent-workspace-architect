import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

import { MIN_TOPIC_AGENTS } from 'src/common/constants/app.constants';

export class ReorderAgentsDto {
  @IsArray()
  @ArrayMinSize(MIN_TOPIC_AGENTS)
  @IsUUID('4', { each: true })
  agentIds!: string[];
}
