import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';

import { AGENT_ROLE_VALUES } from 'src/common/constants/app.constants';
import { MANAGED_LLM_PROVIDER_VALUES } from 'src/llm/llm.constants';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  @Length(1, 60)
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(AGENT_ROLE_VALUES)
  role?: string;

  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && !value.trim() ? undefined : value))
  @IsString()
  @IsIn(MANAGED_LLM_PROVIDER_VALUES)
  provider?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' && !value.trim() ? undefined : value))
  @IsString()
  @Length(2, 120)
  model?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
