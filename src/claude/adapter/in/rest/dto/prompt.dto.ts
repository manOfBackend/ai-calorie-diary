import { IsString, IsNotEmpty } from 'class-validator';

export class PromptDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
