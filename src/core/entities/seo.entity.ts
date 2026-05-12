export interface Product {
  name: string;
  category: string;
}

export interface ContextDocument {
  pageContent: string;
  metadata: Record<string, any>;
}

export interface SeoResult {
  title: string;
  description: string;
  keywords: string[];
  rawResponse: string;
}
