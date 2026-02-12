#!/usr/bin/env node
/**
 * CLI for AI Azure Architecture Generator
 */

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { generate } from './index.js';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
AI Azure Architecture Generator

Usage:
  az-arch-gen "<prompt>" [options]

Options:
  -o, --output <file>    Output file path (default: architecture.drawio)
  -p, --provider <name>  AI provider: claude, openai, azure-openai (default: azure-openai)
  -t, --title <title>    Diagram title
  --api-key <key>        API key (or use env var)
  --endpoint <url>       Azure OpenAI endpoint
  --deployment <name>    Azure OpenAI deployment name
  -h, --help             Show this help

Environment Variables:
  ANTHROPIC_API_KEY      Claude API key
  OPENAI_API_KEY         OpenAI API key
  AZURE_OPENAI_ENDPOINT  Azure OpenAI endpoint
  AZURE_OPENAI_API_KEY   Azure OpenAI API key
  AZURE_OPENAI_DEPLOYMENT Azure OpenAI deployment name

Examples:
  # With Claude
  az-arch-gen "Web tier with 3 VMs behind a load balancer, connected to CosmosDB" -p claude

  # With Azure OpenAI
  az-arch-gen "Hub-spoke network with firewall" -p azure-openai --endpoint https://myresource.openai.azure.com --deployment gpt-4o
`);
    process.exit(0);
  }

  // Parse arguments
  let prompt = '';
  let output = 'architecture.drawio';
  let provider: 'claude' | 'openai' | 'azure-openai' = 'azure-openai';
  let title: string | undefined;
  let apiKey: string | undefined;
  let endpoint: string | undefined;
  let deploymentName: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '-o' || arg === '--output') {
      output = args[++i];
    } else if (arg === '-p' || arg === '--provider') {
      provider = args[++i] as any;
    } else if (arg === '-t' || arg === '--title') {
      title = args[++i];
    } else if (arg === '--api-key') {
      apiKey = args[++i];
    } else if (arg === '--endpoint') {
      endpoint = args[++i];
    } else if (arg === '--deployment') {
      deploymentName = args[++i];
    } else if (!arg.startsWith('-')) {
      prompt = arg;
    }
  }

  if (!prompt) {
    console.error('Error: No prompt provided');
    process.exit(1);
  }

  // Get API keys from environment if not provided
  apiKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.AZURE_OPENAI_API_KEY;
  endpoint = endpoint || process.env.AZURE_OPENAI_ENDPOINT;
  deploymentName = deploymentName || process.env.AZURE_OPENAI_DEPLOYMENT;

  console.log(`🏗️  Generating architecture diagram...`);
  console.log(`   Prompt: "${prompt}"`);
  console.log(`   Provider: ${provider}`);

  try {
    const result = await generate({
      prompt,
      title,
      provider,
      providerConfig: {
        apiKey,
        endpoint,
        deploymentName,
      },
    });

    const outputPath = resolve(output);
    writeFileSync(outputPath, result.xml, 'utf-8');

    console.log(`\n✅ Generated: ${outputPath}`);
    console.log(`\n📊 Resources parsed:`);
    for (const res of result.parsed.resources) {
      const count = res.count && res.count > 1 ? ` (x${res.count})` : '';
      console.log(`   - ${res.type}: ${res.name}${count}`);
    }

    if (result.parsed.connections?.length) {
      console.log(`\n🔗 Connections:`);
      for (const conn of result.parsed.connections) {
        console.log(`   - ${conn.from} → ${conn.to}`);
      }
    }

    console.log(`\n💡 Open the .drawio file with:`);
    console.log(`   - draw.io desktop app`);
    console.log(`   - https://app.diagrams.net`);
    console.log(`   - VS Code with Draw.io extension`);

  } catch (error) {
    console.error(`\n❌ Error: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }
}

main();
