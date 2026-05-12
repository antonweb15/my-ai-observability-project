export interface ILlmService {
  generate(prompt: string, options?: { runName?: string; callbacks?: any[] }): Promise<any>;
  score(params: {
    name: string;
    value: number;
    traceId?: string;
    observationId?: string;
    comment?: string;
  }): Promise<void>;
  getHandler(): any;
  flush(): Promise<void>;
}
