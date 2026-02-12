/**
 * AI Azure Architecture Generator
 * Generate Draw.io diagrams from natural language descriptions
 * Supports complex multi-region, hub-spoke, and HA architectures
 */

import { DrawIOBuilder } from './drawio/xml-builder.js';
import { parseAIResponse, type AIProvider, type ParsedResponse } from './ai/parser.js';
import { ClaudeProvider } from './ai/providers/claude.js';
import { OpenAIProvider } from './ai/providers/openai.js';
import { AzureOpenAIProvider } from './ai/providers/azure-openai.js';
import type { Architecture, Region, Subscription } from './schema/types.js';

export interface GenerateOptions {
  prompt: string;
  title?: string;
  provider?: 'claude' | 'openai' | 'azure-openai';
  providerConfig?: {
    apiKey?: string;
    endpoint?: string;
    deploymentName?: string;
    model?: string;
  };
}

export interface GenerateResult {
  xml: string;
  architecture: Architecture;
  parsed: ParsedResponse;
}

/**
 * Generate a Draw.io diagram from a natural language description
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  let parsed: ParsedResponse;

  if (!options.provider) {
    throw new Error('AI provider is required. Use claude, openai, or azure-openai.');
  }
  // Use AI provider
  const provider = createProvider(options.provider, options.providerConfig);
  parsed = await provider.parse(options.prompt);

  const architecture = parseAIResponse(parsed, options.title);
  const builder = new DrawIOBuilder();
  const xml = builder.generate(architecture);

  return { xml, architecture, parsed };
}



/**
 * Create an AI provider instance
 */
function createProvider(
  type: 'claude' | 'openai' | 'azure-openai',
  config?: GenerateOptions['providerConfig']
): AIProvider {
  switch (type) {
    case 'claude':
      if (!config?.apiKey) {
        throw new Error('Claude API key is required. Set ANTHROPIC_API_KEY or pass apiKey in config.');
      }
      return new ClaudeProvider({
        apiKey: config.apiKey,
        model: config.model,
      });

    case 'openai':
      if (!config?.apiKey) {
        throw new Error('OpenAI API key is required. Set OPENAI_API_KEY or pass apiKey in config.');
      }
      return new OpenAIProvider({
        apiKey: config.apiKey,
        model: config.model,
      });

    case 'azure-openai':
      if (!config?.apiKey || !config?.endpoint || !config?.deploymentName) {
        throw new Error('Azure OpenAI requires endpoint, apiKey, and deploymentName.');
      }
      return new AzureOpenAIProvider({
        endpoint: config.endpoint,
        apiKey: config.apiKey,
        deploymentName: config.deploymentName,
      });

    default:
      throw new Error(`Unknown provider: ${type}`);
  }
}

// Re-export types and utilities
export { DrawIOBuilder } from './drawio/xml-builder.js';
export { parseAIResponse, SYSTEM_PROMPT } from './ai/parser.js';
export { ClaudeProvider } from './ai/providers/claude.js';
export { OpenAIProvider } from './ai/providers/openai.js';
export { AzureOpenAIProvider } from './ai/providers/azure-openai.js';
export { RESOURCES, RESOURCE_ALIASES, AZURE_ICONS, CONTAINER_STYLES, resolveResourceType, getResourcesByCategory, listAllResources } from './schema/resources.js';
export type * from './schema/types.js';
