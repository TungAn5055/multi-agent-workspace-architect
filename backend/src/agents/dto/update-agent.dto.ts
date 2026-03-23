import { IsBoolean, IsIn, IsOptional, IsString, Length } from 'class-validator';

import { AGENT_ROLE_VALUES } from 'src/common/constants/app.constants';

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
  @IsBoolean()
  isEnabled?: boolean;
}
