import { ContextDocument } from '../entities/seo.entity';

export interface IVectorStore {
  similaritySearch(query: string, k: number): Promise<ContextDocument[]>;
  addDocuments(documents: ContextDocument[]): Promise<void>;
}
