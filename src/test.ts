/**
 * Test script - generates sample diagrams
 */

import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, listAllResources } from './index.js';
import { DrawIOBuilder } from './drawio/xml-builder.js';
import type { Architecture } from './schema/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log('🧪 Testing AI Azure Architecture Generator\n');

  // Test: Direct architecture object (programmatic)
  console.log('Test 1: Direct architecture object (programmatic)');
  const arch: Architecture = {
    title: 'Three-Tier Web Application',
    subscription: {
      name: 'Production Subscription',
      resourceGroups: [{
        name: 'rg-production',
        resources: [
          {
            type: 'vnet',
            name: 'vnet-main',
            properties: { addressSpace: '10.0.0.0/16' },
            subnets: [
              {
                type: 'subnet',
                name: 'subnet-web',
                properties: { addressPrefix: '10.0.1.0/24' },
                resources: [
                  { type: 'appGateway', name: 'agw-web' },
                  { type: 'vmss', name: 'vmss-web', properties: { instances: 3 } },
                ],
              },
              {
                type: 'subnet',
                name: 'subnet-app',
                properties: { addressPrefix: '10.0.2.0/24' },
                resources: [
                  { type: 'aks', name: 'aks-app', properties: { nodeCount: 3 } },
                ],
              },
              {
                type: 'subnet',
                name: 'subnet-data',
                properties: { addressPrefix: '10.0.3.0/24' },
                resources: [
                  { type: 'privateEndpoint', name: 'pe-sql' },
                  { type: 'privateEndpoint', name: 'pe-cosmos' },
                ],
              },
            ],
          } as any,
          { type: 'storageAccount', name: 'stproddata01' },
          { type: 'cosmosDb', name: 'cosmos-backend' },
          { type: 'sqlServer', name: 'sql-prod' },
          { type: 'keyVault', name: 'kv-prod-secrets' },
          { type: 'containerRegistry', name: 'acrprod' },
        ],
      }],
    },
    connections: [
      { from: 'agw-web', to: 'vmss-web' },
      { from: 'pe-sql', to: 'sql-prod' },
      { from: 'pe-cosmos', to: 'cosmos-backend' },
    ],
  };

  const builder = new DrawIOBuilder();
  const xml = builder.generate(arch);
  const output = resolve(__dirname, '../output/test-three-tier.drawio');
  writeFileSync(output, xml);
  console.log(`   ✅ Generated: ${output}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ Test completed!');
  console.log('='.repeat(60));
  console.log(`\n📦 Supported resource types: ${listAllResources().length}`);
  console.log('\nOpen the .drawio files with:');
  console.log('  - draw.io desktop app');
  console.log('  - https://app.diagrams.net');
  console.log('  - VS Code with Draw.io extension');
}

test().catch(console.error);
