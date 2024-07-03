import { ApiProperty } from '@nestjs/swagger';

export class ClaudeResponseDto {
  @ApiProperty({ description: 'The response content from Claude' })
  content: string;
}
