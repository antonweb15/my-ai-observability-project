import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { SupabaseService } from '../supabase/supabase.service';
import { TaskType } from '@google/generative-ai';
import { Document } from '@langchain/core/documents';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class VectorStoreService {
  constructor(
    private supabaseService: SupabaseService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Gets embeddings for text.
   */
  private getEmbeddings(taskType?: TaskType) {
    return new GoogleGenerativeAIEmbeddings({
      apiKey:
        this.configService.get<string>('app.google.apiKey') || 'missing-key',
      model: 'gemini-embedding-001',
      taskType: taskType,
    });
  }

  /**
   * Initializes Supabase vector store.
   */
  private getVectorStore(taskType?: TaskType) {
    return new SupabaseVectorStore(this.getEmbeddings(taskType), {
      client: this.supabaseService.getClient(),
      tableName: 'documents',
      queryName: 'match_documents',
    });
  }

  /**
   * Saves documents to the database.
   */
  async addDocuments(
    documents:
      | Document[]
      | { pageContent: string; metadata: Record<string, any> }[],
  ) {
    const vectorStore = this.getVectorStore();
    await vectorStore.addDocuments(documents);
  }

  /**
   * Searches for the most relevant documents by vector.
   */
  async similaritySearch(query: string, k: number = 2) {
    const vectorStore = this.getVectorStore(TaskType.RETRIEVAL_QUERY);
    return await vectorStore.similaritySearch(query, k);
  }
}
