import { Module } from '@nestjs/common';
import { ClaudeController } from '../src/claude/adapter/in/rest/claude.controller';
import { ClaudeService } from '../src/claude/application/service/claude.service';
import {
  CLAUDE_API_PORT,
  ClaudeApiPort,
} from '../src/claude/application/port/out/claude-api.port';

class MockClaudeApiAdapter implements ClaudeApiPort {
  async streamResponse(): Promise<AsyncIterable<{ content: string }>> {
    const mockResponses = ['Hello', ', how', ' can I', ' help you', ' today?'];
    return (async function* () {
      for (const response of mockResponses) {
        yield { content: response };
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay
      }
    })();
  }

  async singleResponse(): Promise<{ content: string }> {
    return { content: `This is a mock response from Claude API.` };
  }
}

@Module({
  controllers: [ClaudeController],
  providers: [
    ClaudeService,
    {
      provide: CLAUDE_API_PORT,
      useClass: MockClaudeApiAdapter,
    },
  ],
})
export class ClaudeTestModule {}
