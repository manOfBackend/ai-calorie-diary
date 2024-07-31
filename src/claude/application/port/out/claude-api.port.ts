import { ClaudeResponse } from '@claude/domain/claude-response';

export const CLAUDE_API_PORT = 'CLAUDE_API_PORT';
export interface ClaudeApiPort {
  streamResponse(prompt: string): Promise<AsyncIterable<ClaudeResponse>>;
  singleResponse(prompt: string): Promise<ClaudeResponse>;
}
