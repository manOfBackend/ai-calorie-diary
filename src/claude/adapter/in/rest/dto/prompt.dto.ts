import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PromptDto {
  @ApiProperty({ description: 'The prompt to send to Claude API' })
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
