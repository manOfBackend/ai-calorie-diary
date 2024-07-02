import { Module } from '@nestjs/common';
import { ClaudeController } from '../src/claude/adapter/in/rest/claude.controller';
import { ClaudeService } from '../src/claude/application/service/claude.service';
import { ClaudeApiPort } from '../src/claude/application/port/out/claude-api.port';

class MockClaudeApiAdapter implements ClaudeApiPort {
  async streamResponse(
    prompt: string,
  ): Promise<AsyncIterable<{ content: string }>> {
    const mockResponses = ['Hello', ', how', ' can I', ' help you', ' today?'];
    return (async function* () {
      for (const response of mockResponses) {
        yield { content: response };
        await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate delay
      }
    })();
  }

  async singleResponse(prompt: string): Promise<{ content: string }> {
    return { content: `This is a mock response from Claude API. :: ${prompt}` };
  }
}

@Module({
  controllers: [ClaudeController],
  providers: [
    ClaudeService,
    {
      provide: 'ClaudeApiPort',
      useClass: MockClaudeApiAdapter,
    },
  ],
})
export class ClaudeTestModule {}
