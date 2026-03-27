import { IsString, Length } from 'class-validator';

export class UpsertLlmCredentialDto {
  @IsString()
  @Length(10, 400)
  apiKey!: string;
}
