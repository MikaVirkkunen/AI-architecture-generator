/**
 * Claude AI Provider
 * Uses Anthropic's Claude API for parsing architecture descriptions
 */

import type { AIProvider, ParsedResponse } from '../parser.js';
import { SYSTEM_PROMPT } from '../parser.js';

interface ClaudeConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export class ClaudeProvider implements AIProvider {
  name = 'claude';
  private config: ClaudeConfig;

  constructor(config: ClaudeConfig) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      baseUrl: 'https://api.anthropic.com',
      ...config,
    };
  }

  async parse(prompt: string): Promise<ParsedResponse> {
    const response = await fetch(`${this.config.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error('No response content from Claude');
    }

    // Parse JSON from response
    try {
      // Extract JSON if wrapped in markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || [null, content];
      const jsonStr = jsonMatch[1] || content;
      return JSON.parse(jsonStr.trim());
    } catch (e) {
      throw new Error(`Failed to parse Claude response as JSON: ${content}`);
    }
  }
}
