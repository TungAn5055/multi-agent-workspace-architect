import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class PostHumanMessageDto {
  @IsString()
  @Length(1, 8000)
  contentMarkdown!: string;

  @IsOptional()
  @IsUUID('4')
  clientRequestId?: string;
}
