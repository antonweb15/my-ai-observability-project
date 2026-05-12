import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { SupabaseService } from '../supabase/supabase.service';
import { TaskType } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';

@Injectable()
export class VectorStoreService {
  constructor(private supabaseService: SupabaseService) {}

  private getEmbeddings(taskType?: TaskType) {
    return new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GOOGLE_API_KEY,
      model: 'gemini-embedding-001',
      taskType: taskType,
    });
  }

  private getVectorStore(taskType?: TaskType) {
    /* eslint-disable @typescript-eslint/no-unsafe-assignment */
    return new SupabaseVectorStore(this.getEmbeddings(taskType), {
      client: this.supabaseService.getClient(),
      tableName: 'documents',
      queryName: 'match_documents',
    });
    /* eslint-enable @typescript-eslint/no-unsafe-assignment */
  }

  async addDocuments(
    documents:
      | Document[]
      | { pageContent: string; metadata: Record<string, any> }[],
  ) {
    const vectorStore = this.getVectorStore();
    await vectorStore.addDocuments(documents);
  }

  async similaritySearch(query: string, k: number = 2) {
    const vectorStore = this.getVectorStore(TaskType.RETRIEVAL_QUERY);
    return await vectorStore.similaritySearch(query, k);
  }
}
