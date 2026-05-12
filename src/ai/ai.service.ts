import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { LangfuseService } from '../langfuse/langfuse.service';
import { VectorStoreService } from '../vector-store/vector-store.service';
import { PromptService } from '../prompt/prompt.service';
import type { ILlmProvider } from '../common/interfaces/llm-provider.interface';

@Injectable()
export class AiService implements OnModuleInit {
    constructor(
        private readonly langfuseService: LangfuseService,
        private readonly vectorStoreService: VectorStoreService,
        private readonly promptService: PromptService,
        @Inject('ILLM_PROVIDER') private readonly llmProvider: ILlmProvider,
    ) {}

    async onModuleInit() {
        console.log('🚀 Starting AI pipeline...');
        try {
            const test = await this.testTrace();
            console.log('✅ Connection test:', (test as any).content);

            console.log('⏳ Seeding Supabase database...');
            await this.seedDatabase();

            console.log('🔍 Searching DB and generating SEO...');
            const ragResponse = await this.generateSeoWithRag(
                'Makita HR2470 Rotary Hammer',
                'tools',
            );
            console.log('✅ RAG Result:', (ragResponse as any).content);

        } catch (e) {
            console.error('❌ Pipeline error:', e.message);
        } finally {
            await this.langfuseService.flush();
            console.log('🏁 All traces sent to Langfuse.');
        }
    }

    async testTrace() {
        const model = this.llmProvider.getModel({
            model: "gemini-3.1-flash-lite",
        });

        return await model.invoke("Hi! Reply 'Gemini online' if you see this.", {
            callbacks: [this.langfuseService.getHandler()],
            runName: "Gemini_Connection_Test",
        });
    }

    async seedDatabase() {
        await this.vectorStoreService.addDocuments([
            {
                pageContent: "Nike Air Max sneakers. Legendary design, maximum comfort and cushioning for active running.",
                metadata: { category: "footwear", style: "premium" }
            },
            {
                pageContent: "Bosch PSR 1200 drill. Compact and powerful tool for drilling and screw driving at home.",
                metadata: { category: "tools", style: "professional" }
            },
        ]);
    }

    async generateSeoWithRag(productName: string, category: string) {
        // 1. Search for context
        const docs = await this.vectorStoreService.similaritySearch(category, 2);
        const context = docs.map(d => d.pageContent).join("\n\n");

        // 2. Get prompt from Langfuse
        const compiledPrompt = await this.promptService.getCompiledPrompt("seo_description_generator", {
            productName: productName,
            category: category,
            context: context
        });

        // 3. Initialize model
        const model = this.llmProvider.getModel({
            model: "gemini-3.1-flash-lite",
            temperature: 0.2,
        });

        // 4. Generate with tracing
        const langfuseHandler = this.langfuseService.getHandler();
        const response = await model.invoke(compiledPrompt, {
            callbacks: [langfuseHandler],
            runName: "RAG_SEO_Generation",
        });

        // 5. SCORING & QUALITY CHECK
        const traceId = langfuseHandler.traceId;
        const observationId = langfuseHandler.observationId || langfuseHandler.getLangchainRunId();

        try {
            const rawContent = (response as any).content.toString();
            // Clear from markdown wrapper
            const jsonMatch = rawContent.match(/```json?([\s\S]*?)```/) || [null, rawContent];
            const cleanContent = jsonMatch[1].trim();
            
            JSON.parse(cleanContent); // Validation check

            if (traceId) {
                await this.langfuseService.score({
                    name: "valid_json",
                    value: 1,
                    traceId: traceId,
                    observationId: observationId,
                    comment: "JSON successfully parsed",
                    dataType: "NUMERIC"
                });
            }
        } catch (e) {
            if (traceId) {
                await this.langfuseService.score({
                    name: "valid_json",
                    value: 0,
                    traceId: traceId,
                    observationId: observationId,
                    comment: `Parsing error: ${e.message}`,
                    dataType: "NUMERIC"
                });
            }
        } finally {
            // Guarantee data delivery to Langfuse
            await this.langfuseService.flush();
        }

        return response;
    }
}
