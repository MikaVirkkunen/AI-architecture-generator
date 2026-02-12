/**
 * Azure OpenAI Provider
 * Uses Azure OpenAI Service for parsing architecture descriptions
 */

import type { AIProvider, ParsedResponse } from '../parser.js';
import { SYSTEM_PROMPT } from '../parser.js';

interface AzureOpenAIConfig {
  endpoint: string;     // e.g., https://your-resource.openai.azure.com
  apiKey: string;
  deploymentName: string;
  apiVersion?: string;
}

export class AzureOpenAIProvider implements AIProvider {
  name = 'azure-openai';
  private config: AzureOpenAIConfig;

  constructor(config: AzureOpenAIConfig) {
    this.config = {
      apiVersion: '2024-02-15-preview',
      ...config,
    };
  }

  async parse(prompt: string): Promise<ParsedResponse> {
    const url = `${this.config.endpoint}/openai/deployments/${this.config.deploymentName}/chat/completions?api-version=${this.config.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_completion_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from Azure OpenAI');
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to parse Azure OpenAI response as JSON: ${content}`);
    }
  }
}

/**
 * Example configuration for Azure OpenAI:
 * 
 * const provider = new AzureOpenAIProvider({
 *   endpoint: process.env.AZURE_OPENAI_ENDPOINT!,
 *   apiKey: process.env.AZURE_OPENAI_API_KEY!,
 *   deploymentName: 'gpt-4o',
 * });
 */
