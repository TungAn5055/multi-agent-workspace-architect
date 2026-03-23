import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

import { MAX_TOPIC_AGENTS, MIN_TOPIC_AGENTS } from 'src/common/constants/app.constants';
import { CreateTopicAgentDto } from 'src/topics/dto/create-topic-agent.dto';

export class CreateTopicDto {
  @IsString()
  @Length(3, 160)
  title!: string;

  @IsArray()
  @ArrayMinSize(MIN_TOPIC_AGENTS)
  @ArrayMaxSize(MAX_TOPIC_AGENTS)
  @ValidateNested({ each: true })
  @Type(() => CreateTopicAgentDto)
  agents!: CreateTopicAgentDto[];

  @IsOptional()
  @IsString()
  @Length(2, 100)
  model?: string;
}
