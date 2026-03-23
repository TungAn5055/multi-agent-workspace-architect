import { IsString, Length } from 'class-validator';

export class UpdateTopicTitleDto {
  @IsString()
  @Length(3, 160)
  title!: string;
}
