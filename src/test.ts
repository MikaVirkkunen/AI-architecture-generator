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

  // Test 2: Hub-spoke with multiple VNets (tests edge routing around containers)
  console.log('\nTest 2: Hub-spoke with peering connections');
  const hubSpoke: Architecture = {
    title: 'Hub-Spoke with APIM',
    description: 'Tests that peering lines route around intermediate containers.',
    regions: [{
      name: 'West Europe (Primary)',
      isPrimary: true,
      resourceGroups: [
        {
          name: 'rg-hub-weu',
          resources: [
            {
              type: 'hubVnet', name: 'vnet-hub-weu',
              properties: { addressSpace: '10.0.0.0/16' },
              subnets: [
                { type: 'subnet', name: 'GatewaySubnet-weu', properties: { addressPrefix: '10.0.0.0/24' }, resources: [
                  { type: 'vpnGateway', name: 'vpngw-hub-weu', properties: { sku: 'VpnGw2' } },
                ] },
                { type: 'subnet', name: 'AzureFirewallSubnet-weu', properties: { addressPrefix: '10.0.1.0/24' }, resources: [
                  { type: 'firewall', name: 'fw-hub-weu', properties: { sku: 'AZFW_VNet' } },
                ] },
                { type: 'subnet', name: 'AzureBastionSubnet-weu', properties: { addressPrefix: '10.0.2.0/24' }, resources: [
                  { type: 'bastion', name: 'bas-hub-weu', properties: { sku: 'Standard' } },
                ] },
              ],
            } as any,
          ],
        },
        {
          name: 'rg-workload-weu',
          resources: [
            {
              type: 'vnet', name: 'vnet-spoke-weu',
              properties: { addressSpace: '10.1.0.0/16' },
              subnets: [
                { type: 'subnet', name: 'subnet-web-weu', properties: { addressPrefix: '10.1.0.0/24' } },
                { type: 'subnet', name: 'subnet-app-weu', properties: { addressPrefix: '10.1.1.0/24' }, resources: [
                  { type: 'vm', name: 'vm-weu-01', properties: { vmSize: 'Standard_D2s_v5', availabilityZone: 1 } },
                  { type: 'vm', name: 'vm-weu-02', properties: { vmSize: 'Standard_D2s_v5', availabilityZone: 2 } },
                ] },
                { type: 'subnet', name: 'subnet-data-weu', properties: { addressPrefix: '10.1.2.0/24' } },
              ],
            } as any,
          ],
        },
        {
          name: 'rg-apim-weu',
          resources: [
            {
              type: 'vnet', name: 'vnet-apim-weu',
              properties: { addressSpace: '10.4.0.0/16' },
              subnets: [
                { type: 'subnet', name: 'subnet-apim-weu', properties: { addressPrefix: '10.4.0.0/24' }, resources: [
                  { type: 'apiManagement', name: 'apim-weu', properties: { sku: 'Developer', kind: 'VNET' } },
                ] },
              ],
            } as any,
          ],
        },
      ],
    }],
    connections: [
      { from: 'vnet-hub-weu', to: 'vnet-spoke-weu', style: 'peering', label: 'Hub-Spoke Peering' },
      { from: 'vnet-hub-weu', to: 'vnet-apim-weu', style: 'peering', label: 'Hub-APIM Peering' },
    ],
  };

  const builder2 = new DrawIOBuilder();
  const xml2 = builder2.generate(hubSpoke);
  const output2 = resolve(__dirname, '../output/test-hub-spoke.drawio');
  writeFileSync(output2, xml2);
  console.log(`   ✅ Generated: ${output2}`);

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
