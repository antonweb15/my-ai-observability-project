export interface IPromptProvider {
  getPrompt(name: string, variables: Record<string, any>): Promise<string>;
}
