import { Injectable } from '@nestjs/common';
import { IVectorStore } from '../../core/ports/vector-store.port';
import { VectorStoreService } from '../../vector-store/vector-store.service';
import { ContextDocument } from '../../core/entities/seo.entity';

@Injectable()
export class SupabaseVectorStoreAdapter implements IVectorStore {
  constructor(private readonly vectorStoreService: VectorStoreService) {}

  async similaritySearch(query: string, k: number): Promise<ContextDocument[]> {
    const results = await this.vectorStoreService.similaritySearch(query, k);
    return results.map(doc => ({
      pageContent: doc.pageContent,
      metadata: doc.metadata,
    }));
  }

  async addDocuments(documents: ContextDocument[]): Promise<void> {
    await this.vectorStoreService.addDocuments(documents);
  }
}
