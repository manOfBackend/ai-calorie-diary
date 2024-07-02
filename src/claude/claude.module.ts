import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClaudeController } from './adapter/in/rest/claude.controller';
import { ClaudeService } from './application/service/claude.service';
import { ClaudeApiAdapter } from './adapter/out/api/claude-api.adapter';

@Module({
  imports: [ConfigModule],
  controllers: [ClaudeController],
  providers: [
    ClaudeService,
    {
      provide: 'ClaudeApiPort',
      useClass: ClaudeApiAdapter,
    },
  ],
})
export class ClaudeModule {}
