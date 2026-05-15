import { Injectable, OnModuleInit, MessageEvent } from '@nestjs/common';
import { CallbackHandler } from 'langfuse-langchain';
import { createClient } from '@supabase/supabase-js';
import { Observable } from 'rxjs';
import axios from 'axios';

@Injectable()
export class AiService implements OnModuleInit {
  private langfuseHandler: CallbackHandler;
  private supabaseClient;
  private readonly flowiseBaseUrl = process.env.FLOWISE_BASE_URL || 'http://localhost:3005';

  constructor() {
    this.langfuseHandler = new CallbackHandler({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
    });

    this.supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    );
  }

  async onModuleInit() {
    console.log('🚀 AI Service initialized. Ready for streaming at POST /api/generate-seo');
  }

  /**
   * Stream SEO generation via external Flowise service.
   * Uses axios to get data stream and RxJS Observable to pass it to the controller.
   */
  streamSeoFromFlowise(dto: { product_name: string; category: string; keywords: string }): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      const baseUrl = process.env.FLOWISE_BASE_URL || 'http://127.0.0.1:3005';
      const chatflowId = 'b0d51168-0af2-4495-b7dc-35ad5b9c8456';
      const fullApiUrl = `${baseUrl}/api/v1/prediction/${chatflowId}`;

      const payload = {
        question: `Generate SEO for product: ${dto.product_name}, category: ${dto.category}, keywords: ${dto.keywords}`,
        overrideConfig: {
          promptValues: {
            product_name: dto.product_name,
            category: dto.category,
            keywords: dto.keywords
          }
        },
        streaming: true
      };

      console.log(`📡 [PRODUCTION] Sending request to: ${fullApiUrl}`);

      axios({
        method: 'POST',
        url: fullApiUrl,
        data: payload,
        responseType: 'stream',
        timeout: 45000
      })
          .then((response) => {
            console.log('🔥 [PRODUCTION] Network stream opened. Processing data...');

            response.data.on('data', (chunk: Buffer) => {
              const rawChunk = chunk.toString().trim();
              if (!rawChunk) return;

              // Check if data is in standard SSE format (data: ...)
              if (rawChunk.startsWith('data:')) {
                const lines = rawChunk.split('\n');
                for (const line of lines) {
                  if (line.startsWith('data:')) {
                    const cleanedLine = line.replace('data:', '').trim();
                    try {
                      const parsed = JSON.parse(cleanedLine);
                      // If SSE contains a ready json block from Structured Parser
                      if (parsed.json) {
                        subscriber.next({ data: JSON.stringify(parsed.json) } as MessageEvent);
                      } else if (parsed.text) {
                        subscriber.next({ data: parsed.text } as MessageEvent);
                      }
                    } catch {
                      subscriber.next({ data: cleanedLine } as MessageEvent);
                    }
                  }
                }
              } else {
                // CASE AS NOW: Flowise sent raw structured JSON chunk directly
                try {
                  const parsed = JSON.parse(rawChunk);
                  if (parsed.json) {
                    // Extract only clean SEO structure
                    subscriber.next({ data: JSON.stringify(parsed.json) } as MessageEvent);
                  } else {
                    subscriber.next({ data: rawChunk } as MessageEvent);
                  }
                } catch {
                  // If it's just text, send as is
                  subscriber.next({ data: rawChunk } as MessageEvent);
                }
              }
            });

            response.data.on('end', () => {
              console.log('✅ [PRODUCTION] Data stream successfully finished.');
              subscriber.complete();
            });

            response.data.on('error', (err) => {
              subscriber.error(new Error(`Stream error: ${err.message}`));
            });
          })
          .catch((error) => {
            const status = error.response ? `Status: ${error.response.status}` : error.message;
            console.error('❌ [PRODUCTION] Connection failed:', status);
            subscriber.error(new Error(`Flowise connection failed: ${status}`));
          });
    });
  }

}
