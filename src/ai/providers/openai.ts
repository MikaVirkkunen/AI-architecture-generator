/**
 * OpenAI Provider
 * Uses OpenAI's API for parsing architecture descriptions
 */

import type { AIProvider, ParsedResponse } from '../parser.js';
import { SYSTEM_PROMPT } from '../parser.js';

interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private config: OpenAIConfig;

  constructor(config: OpenAIConfig) {
    this.config = {
      model: 'gpt-4o',
      baseUrl: 'https://api.openai.com',
      ...config,
    };
  }

  async parse(prompt: string): Promise<ParsedResponse> {
    const response = await fetch(`${this.config.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: this.config.model,
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
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as any;
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    try {
      return JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to parse OpenAI response as JSON: ${content}`);
    }
  }
}
