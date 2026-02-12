/**
 * Test script - generates sample diagrams
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generate, generateFromArchitecture, listAllResources } from './index.js';
import type { Architecture } from './schema/types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function test() {
  console.log('🧪 Testing AI Azure Architecture Generator\n');

  // Test 1: Simple prompt
  console.log('Test 1: Simple prompt');
  const result1 = await generate({
    prompt: '3 VMs with VNET and storage account and CosmosDB backend',
    title: 'Simple Test - VMs with Backend',
    provider: 'simple',
  });
  
  const output1 = resolve(__dirname, '../output/test-simple.drawio');
  writeFileSync(output1, result1.xml);
  console.log(`   ✅ Generated: ${output1}`);
  console.log(`   Resources: ${result1.parsed.resources.map(r => r.type).join(', ')}`);

  // Test 2: Hub-spoke architecture
  console.log('\nTest 2: Hub-spoke architecture');
  const result2 = await generate({
    prompt: 'Hub and spoke network with firewall, bastion, VPN gateway, and 2 VMs in spoke',
    title: 'Hub-Spoke Architecture',
    provider: 'simple',
  });
  
  const output2 = resolve(__dirname, '../output/test-hub-spoke.drawio');
  writeFileSync(output2, result2.xml);
  console.log(`   ✅ Generated: ${output2}`);
  console.log(`   Resources: ${result2.parsed.resources.slice(0, 8).map(r => r.type).join(', ')}...`);

  // Test 3: Multi-region HA with ExpressRoute
  console.log('\nTest 3: Multi-region HA with ExpressRoute');
  const result3 = await generate({
    prompt: 'HA dual region (West Europe, North Europe) hub-spoke with ExpressRoute, firewall, and VPN',
    title: 'Multi-Region HA Architecture',
    provider: 'simple',
  });
  
  const output3 = resolve(__dirname, '../output/test-multi-region.drawio');
  writeFileSync(output3, result3.xml);
  console.log(`   ✅ Generated: ${output3}`);
  console.log(`   Regions: ${result3.parsed.regions?.join(', ')}`);
  console.log(`   Has on-premises: ${result3.parsed.hasOnPremises}`);

  // Test 4: Load JSON template
  console.log('\nTest 4: Load JSON template');
  try {
    const templatePath = resolve(__dirname, '../templates/ha-expressroute-hub-spoke.json');
    const template = JSON.parse(readFileSync(templatePath, 'utf-8')) as Architecture;
    const xml4 = generateFromArchitecture(template);
    const output4 = resolve(__dirname, '../output/test-template.drawio');
    writeFileSync(output4, xml4);
    console.log(`   ✅ Generated: ${output4}`);
    console.log(`   Template: HA ExpressRoute Hub-Spoke`);
  } catch (e) {
    console.log(`   ⚠️ Skipped: Template file not found or invalid`);
  }

  // Test 5: Direct architecture object (programmatic)
  console.log('\nTest 5: Direct architecture object (programmatic)');
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

  const xml5 = generateFromArchitecture(arch);
  const output5 = resolve(__dirname, '../output/test-three-tier.drawio');
  writeFileSync(output5, xml5);
  console.log(`   ✅ Generated: ${output5}`);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('✨ All tests completed!');
  console.log('='.repeat(60));
  console.log(`\n📦 Supported resource types: ${listAllResources().length}`);
  console.log('\nOpen the .drawio files with:');
  console.log('  - draw.io desktop app');
  console.log('  - https://app.diagrams.net');
  console.log('  - VS Code with Draw.io extension');
}

test().catch(console.error);
