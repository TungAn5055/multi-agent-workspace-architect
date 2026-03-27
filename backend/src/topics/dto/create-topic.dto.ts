import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsOptional, IsString, Length, ValidateNested } from 'class-validator';

import { MAX_TOPIC_AGENTS, MIN_TOPIC_AGENTS } from 'src/common/constants/app.constants';
import { MANAGED_LLM_PROVIDER_VALUES } from 'src/llm/llm.constants';
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
  @Transform(({ value }) => (typeof value === 'string' && !value.trim() ? undefined : value))
  @IsString()
  @IsIn(MANAGED_LLM_PROVIDER_VALUES)
  provider?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && !value.trim() ? undefined : value))
  @IsString()
  @Length(2, 100)
  model?: string;
}
