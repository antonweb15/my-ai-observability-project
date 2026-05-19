import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CallbackHandler } from 'langfuse-langchain';
import { LangfuseService } from './langfuse.service';

@Module({
  providers: [
    {
      provide: 'LANGFUSE_HANDLER',
      useFactory: (configService: ConfigService) => {
        return new CallbackHandler({
          publicKey: configService.get<string>('app.langfuse.publicKey') || '',
          secretKey: configService.get<string>('app.langfuse.secretKey') || '',
          baseUrl: configService.get<string>('app.langfuse.baseUrl'),
        });
      },
      inject: [ConfigService],
    },
    LangfuseService,
  ],
  exports: ['LANGFUSE_HANDLER', LangfuseService],
})
export class LangfuseModule {}
