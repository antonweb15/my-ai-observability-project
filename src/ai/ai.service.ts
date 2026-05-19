import { Injectable, OnModuleInit, MessageEvent, Logger } from '@nestjs/common';
import { CallbackHandler } from 'langfuse-langchain';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Observable } from 'rxjs';
import axios from 'axios';
import { EventEmitter } from 'events';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { TaskType } from '@google/generative-ai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private langfuseHandler: CallbackHandler;
  private supabaseClient: SupabaseClient;
  private readonly flowiseBaseUrl =
    process.env.FLOWISE_BASE_URL || 'http://localhost:3005';

  constructor() {
    this.langfuseHandler = new CallbackHandler({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }

  onModuleInit() {
    this.logger.log(
      'AI Service initialized. Ready for streaming at POST /api/generate-seo',
    );
  }

  /**
   * Stream SEO generation via external Flowise service.
   * Uses axios to get data stream and RxJS Observable to pass it to the controller.
   */
  streamSeoFromFlowise(dto: {
    product_name: string;
    category: string;
    keywords: string;
  }): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const baseUrl = process.env.FLOWISE_BASE_URL || 'http://127.0.0.1:3005';
      const chatflowId = 'b0d51168-0af2-4495-b7dc-35ad5b9c8456';
      const fullApiUrl = `${baseUrl}/api/v1/prediction/${chatflowId}`;

      this.logger.log(
        `🔍 [RAG] Starting context search for category: ${dto.category}`,
      );

      this.getContextFromSupabase(dto.category)
        .then((context) => {
          this.logger.log(
            `✅ [RAG] Context retrieved. Length: ${context.length}`,
          );

          const payload = {
            question: `Generate SEO for product: ${dto.product_name}`,
            overrideConfig: {
              promptValues: {
                product_name: dto.product_name,
                category: dto.category,
                keywords: dto.keywords,
                context: context,
              },
            },
            streaming: true,
          };

          this.logger.log(`Sending request to Flowise: ${fullApiUrl}`);

          return axios({
            method: 'POST',
            url: fullApiUrl,
            data: payload,
            responseType: 'stream',
            timeout: 45000,
          });
        })
        .then((response) => {
          const axiosResponse = response as { data: EventEmitter };
          if (!axiosResponse || !axiosResponse.data) return;

          this.logger.log('Network stream opened. Processing data...');

          const stream = axiosResponse.data;
          stream.on('data', (chunk: Buffer) => {
            const rawChunk = chunk.toString().trim();
            if (!rawChunk) return;

            // Check if data is in standard SSE format (data: ...)
            if (rawChunk.startsWith('data:')) {
              const lines = rawChunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data:')) {
                  const cleanedLine = line.replace('data:', '').trim();
                  try {
                    const parsed = JSON.parse(cleanedLine) as Record<
                      string,
                      any
                    >;
                    // If SSE contains a ready json block from Structured Parser
                    if (parsed['json']) {
                      subscriber.next({
                        data: JSON.stringify(parsed['json']),
                      });
                    } else if (parsed['text']) {
                      subscriber.next({ data: String(parsed['text']) });
                    }
                  } catch {
                    subscriber.next({ data: cleanedLine });
                  }
                }
              }
            } else {
              // CASE AS NOW: Flowise sent raw structured JSON chunk directly
              try {
                const parsed = JSON.parse(rawChunk) as Record<string, any>;
                if (parsed['json']) {
                  // Extract only clean SEO structure
                  subscriber.next({
                    data: JSON.stringify(parsed['json']),
                  });
                } else {
                  subscriber.next({ data: rawChunk });
                }
              } catch {
                // If it's just text, send as is
                subscriber.next({ data: rawChunk });
              }
            }
          });

          stream.on('end', () => {
            this.logger.log('Data stream successfully finished.');
            subscriber.complete();
          });

          stream.on('error', (err: Record<string, any>) => {
            subscriber.error(
              new Error(`Stream error: ${String(err?.['message'])}`),
            );
          });
        })
        .catch((error: unknown) => {
          const err = error as Record<string, any>;
          const status = err?.['response']
            ? `Status: ${String((err['response'] as Record<string, any>)['status'])}`
            : String(err?.['message'] || err);
          this.logger.error(`Connection or RAG failed: ${status}`);
          subscriber.error(
            new Error(`Flowise/RAG connection failed: ${status}`),
          );
        });
    });
  }

  /**
   * Retrieve context from Supabase based on semantic search
   */
  private async getContextFromSupabase(query: string): Promise<string> {
    try {
      const embeddings = new GoogleGenerativeAIEmbeddings({
        apiKey: process.env.GOOGLE_API_KEY,
        model: 'gemini-embedding-001',
        taskType: TaskType.RETRIEVAL_QUERY,
      });

      const vectorStore = new SupabaseVectorStore(embeddings, {
        client: this.supabaseClient as any,
        tableName: 'documents',
        queryName: 'match_documents',
      });

      const docs = await vectorStore.similaritySearch(query, 2);
      return docs.map((d) => d.pageContent).join('\n\n') || 'No style examples.';
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `RAG Search failed: ${errorMessage}. Proceeding without context.`,
      );
      return 'No style examples.';
    }
  }
}
