import { Injectable, OnModuleInit } from '@nestjs/common';
import { CallbackHandler } from 'langfuse-langchain';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class AiService implements OnModuleInit {
    private langfuseHandler: CallbackHandler;
    private supabaseClient;

    constructor() {
        this.langfuseHandler = new CallbackHandler({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_BASE_URL,
        });

        this.supabaseClient = createClient(
            process.env.SUPABASE_URL || '',
            process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        );
    }

    async onModuleInit() {
        console.log('🚀 Starting AI pipeline...');
        try {
            const test = await this.testTrace();
            console.log('✅ Connection test:', test.content);

            console.log('⏳ Seeding Supabase database...');
            await this.seedDatabase();

            console.log('🔍 Searching DB and generating SEO...');
            const ragResponse = await this.generateSeoWithRag(
                'Makita HR2470 Rotary Hammer',
                'tools',
            );
            console.log('✅ RAG Result:', ragResponse.content);

        } catch (e) {
            console.error('❌ Pipeline error:', e.message);
        } finally {
            await this.langfuseHandler.flushAsync();
            console.log('🏁 All traces sent to Langfuse.');
        }
    }

    async testTrace() {
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-3.1-flash-lite",
        });

        return await model.invoke("Hi! Reply 'Gemini online' if you see this.", {
            callbacks: [this.langfuseHandler],
            runName: "Gemini_Connection_Test",
        });
    }

    async seedDatabase() {
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-embedding-001",
        });

        const vectorStore = new SupabaseVectorStore(embeddings, {
            client: this.supabaseClient,
            tableName: "documents",
            queryName: "match_documents",
        });

        await vectorStore.addDocuments([
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
        // 1. Setup actual embeddings
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-embedding-001", // Actual model
            taskType: TaskType.RETRIEVAL_QUERY,
        });

        const vectorStore = new SupabaseVectorStore(embeddings, {
            client: this.supabaseClient,
            tableName: "documents",
            queryName: "match_documents",
        });

        // 2. Search for context
        const docs = await vectorStore.similaritySearch(category, 2);
        const context = docs.map(d => d.pageContent).join("\n\n");

        // 3. Get prompt from Langfuse (Removing hardcode)
        // Ensure that a prompt with name "seo_description_generator" is created in Langfuse
        // Теперь код всегда берет версию с тегом 'production'
        const promptConfig = await this.langfuseHandler.langfuse.getPrompt("seo_description_generator", undefined, { label: "production" });
        
        const compiledPrompt = promptConfig.compile({
            productName: productName,
            category: category,
            context: context
        });

        // 4. Initialize model
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-3.1-flash-lite", // or "gemini-3.1-flash-lite"
            temperature: 0.2,
        });

        // 5. Generate with tracing
        const response = await model.invoke(compiledPrompt, {
            callbacks: [this.langfuseHandler],
            runName: "RAG_SEO_Generation",
        });

        // 6. SCORING & QUALITY CHECK
        const traceId = this.langfuseHandler.traceId;
        const observationId = this.langfuseHandler.observationId || this.langfuseHandler.getLangchainRunId();

        try {
            const rawContent = response.content.toString();
            // Clear from markdown wrapper
            const jsonMatch = rawContent.match(/```json?([\s\S]*?)```/) || [null, rawContent];
            const cleanContent = jsonMatch[1].trim();
            
            JSON.parse(cleanContent); // Validation check

            if (traceId) {
                await this.langfuseHandler.langfuse.score({
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
                await this.langfuseHandler.langfuse.score({
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
            await this.langfuseHandler.langfuse.flushAsync();
        }

        return response;
    }
}
