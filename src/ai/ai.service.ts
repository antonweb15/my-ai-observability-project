import { Injectable, OnModuleInit } from '@nestjs/common';
import { CallbackHandler } from 'langfuse-langchain';
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
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
            model: "gemini-1.5-flash",
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
        const embeddings = new GoogleGenerativeAIEmbeddings({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-embedding-001",
        });

        const vectorStore = new SupabaseVectorStore(embeddings, {
            client: this.supabaseClient,
            tableName: "documents",
            queryName: "match_documents",
        });

        const docs = await vectorStore.similaritySearch(category, 2);
        const context = docs.map(d => d.pageContent).join("\n\n");

        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            model: "gemini-3.1-flash-lite",
            temperature: 0.2,
        });

        const prompt = `
      You are a professional SEO copywriter. 
      Use the STYLE EXAMPLES below to create a description.
      
      STYLE EXAMPLES:
      ${context}

      TASK:
      Write an attractive SEO description for the product: "${productName}"
      Category: "${category}"
      
      Return the response in JSON format:
      {
        "title": "title",
        "description": "description"
      }
    `;

        const response = await model.invoke(prompt, {
            callbacks: [this.langfuseHandler],
            runName: "RAG_SEO_Generation",
        });

        // --- SCORING MODULE (Quality Check) ---
        try {
            const rawContent = response.content.toString();

            // More reliable JSON extraction: searching for a block between ```json and ``` or just the first {
            const jsonMatch = rawContent.match(/```json?([\s\S]*?)```/) || [null, rawContent];
            const cleanContent = jsonMatch[1].trim();

            JSON.parse(cleanContent);

            // Get ID from handler
            const traceId = this.langfuseHandler.traceId;
            // observationId in CallbackHandler often points to the last active step.
            // If it's undefined, Langfuse will still show the score in the trace by traceId.
            const observationId = this.langfuseHandler.observationId || this.langfuseHandler.getLangchainRunId();

            if (traceId) {
                await this.langfuseHandler.langfuse.score({
                    name: "valid_json",
                    value: 1,
                    traceId: traceId,
                    observationId: observationId,
                    comment: "Response successfully parsed as JSON",
                    dataType: "NUMERIC"
                });
                
                // For reliability in scripts, call flush immediately
                await this.langfuseHandler.langfuse.flushAsync();
                
                console.log(`⭐️ Score linked to Trace: ${traceId} | Observation: ${observationId}`);
            }
        } catch (e) {
            const traceId = this.langfuseHandler.traceId;
            const observationId = this.langfuseHandler.observationId || this.langfuseHandler.getLangchainRunId();
            if (traceId) {
                await this.langfuseHandler.langfuse.score({
                    name: "valid_json",
                    value: 0,
                    traceId: traceId,
                    observationId: observationId,
                    comment: `Parsing error: ${e.message}`,
                    dataType: "NUMERIC"
                });
                await this.langfuseHandler.langfuse.flushAsync();
            }
            console.log(`😡 Quality score: 0 (Invalid JSON) | Trace ID: ${traceId || 'N/A'}`);
        }

        return response;
    }
}
