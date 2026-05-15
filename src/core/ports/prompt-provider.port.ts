/**
 * Port for prompt management.
 */
export interface IPromptProvider {
  /**
   * Returns a compiled prompt by name.
   */
  getPrompt(name: string, variables: Record<string, any>): Promise<string>;
}
