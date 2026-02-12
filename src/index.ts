/**
 * AI Azure Architecture Generator
 * Generate Draw.io diagrams from natural language descriptions
 * Supports complex multi-region, hub-spoke, and HA architectures
 */

import { DrawIOBuilder } from './drawio/xml-builder.js';
import { parseAIResponse, parseSimple, type AIProvider, type ParsedResponse } from './ai/parser.js';
import { ClaudeProvider } from './ai/providers/claude.js';
import { OpenAIProvider } from './ai/providers/openai.js';
import { AzureOpenAIProvider } from './ai/providers/azure-openai.js';
import type { Architecture, Region, Subscription } from './schema/types.js';

export interface GenerateOptions {
  prompt: string;
  title?: string;
  provider?: 'claude' | 'openai' | 'azure-openai' | 'simple';
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

  if (options.provider === 'simple' || !options.provider) {
    // Use simple local parser (no AI)
    parsed = parseSimple(options.prompt);
  } else {
    // Use AI provider
    const provider = createProvider(options.provider, options.providerConfig);
    parsed = await provider.parse(options.prompt);
  }

  const architecture = parseAIResponse(parsed, options.title);
  const builder = new DrawIOBuilder();
  const xml = builder.generate(architecture);

  return { xml, architecture, parsed };
}

/**
 * Generate from a pre-built architecture object (e.g., from JSON template)
 */
export function generateFromArchitecture(arch: Architecture): string {
  // Handle different architecture formats
  const normalizedArch = normalizeArchitecture(arch);
  const builder = new DrawIOBuilder();
  return builder.generate(normalizedArch);
}

/**
 * Normalize architecture to handle various input formats
 */
function normalizeArchitecture(arch: Architecture): Architecture {
  // If we have regions at top level, that's the multi-region format
  if (arch.regions && arch.regions.length > 0) {
    return arch;
  }
  
  // If we have a subscription, that's the simple format
  if (arch.subscription) {
    return arch;
  }
  
  // If we have subscriptions array, use first one
  if (arch.subscriptions && arch.subscriptions.length > 0) {
    return {
      ...arch,
      subscription: arch.subscriptions[0],
    };
  }
  
  // Fallback: create empty subscription
  return {
    ...arch,
    subscription: {
      name: 'Azure Subscription',
      resourceGroups: [],
    },
  };
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
export { parseSimple, parseAIResponse, SYSTEM_PROMPT } from './ai/parser.js';
export { ClaudeProvider } from './ai/providers/claude.js';
export { OpenAIProvider } from './ai/providers/openai.js';
export { AzureOpenAIProvider } from './ai/providers/azure-openai.js';
export { RESOURCES, RESOURCE_ALIASES, AZURE_ICONS, CONTAINER_STYLES, resolveResourceType, getResourcesByCategory, listAllResources } from './schema/resources.js';
export type * from './schema/types.js';
