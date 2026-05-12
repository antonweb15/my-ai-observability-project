import { Injectable, OnModuleInit } from '@nestjs/common';
import { GenerateSeoUseCase } from '../core/use-cases/generate-seo.use-case';
import { LlmServiceAdapter } from '../infrastructure/llm/llm-service.adapter';
import { VectorStoreService } from '../vector-store/vector-store.service';

@Injectable()
export class AiService implements OnModuleInit {
  constructor(
    private readonly generateSeoUseCase: GenerateSeoUseCase,
    private readonly llmService: LlmServiceAdapter,
    private readonly vectorStoreService: VectorStoreService,
  ) {}

  async onModuleInit() {
    console.log('🚀 Starting AI pipeline (Refactored)...');
    try {
      console.log('⏳ Seeding Supabase database...');
      await this.seedDatabase();

      console.log('🔍 Executing GenerateSeoUseCase...');
      const result = await this.generateSeoUseCase.execute({
        name: 'Makita HR2470 Rotary Hammer',
        category: 'tools',
      });
      const content =
        typeof result === 'object' && result !== null && 'content' in result
          ? result.content
          : result;
      console.log('✅ UseCase Result:', content);
    } catch (e) {
      console.error(
        '❌ Pipeline error:',
        e instanceof Error ? e.message : String(e),
      );
    } finally {
      await this.llmService.flush();
      console.log('🏁 All traces sent to Langfuse.');
    }
  }

  async seedDatabase() {
    await this.vectorStoreService.addDocuments([
      {
        pageContent:
          'Nike Air Max sneakers. Legendary design, maximum comfort and cushioning for active running.',
        metadata: { category: 'footwear', style: 'premium' },
      },
      {
        pageContent:
          'Bosch PSR 1200 drill. Compact and powerful tool for drilling and screw driving at home.',
        metadata: { category: 'tools', style: 'professional' },
      },
    ]);
  }
}
