import { Injectable } from '@nestjs/common';
import { IVectorStore } from '../../core/ports/vector-store.port';
import { VectorStoreService } from '../../vector-store/vector-store.service';
import { ContextDocument } from '../../core/entities/seo.entity';

@Injectable()
export class SupabaseVectorStoreAdapter implements IVectorStore {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  /**
   * Searches for similar documents in the vector store.
   * @param query Text query.
   * @param k Number of documents to return.
   */
  async similaritySearch(query: string, k: number): Promise<ContextDocument[]> {
    const results = await this.vectorStoreService.similaritySearch(query, k);
    return results.map((doc) => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
    }));
  }

  /**
   * Adds documents to the vector store.
   */
  async addDocuments(documents: ContextDocument[]): Promise<void> {
    await this.vectorStoreService.addDocuments(documents);
  }
}
