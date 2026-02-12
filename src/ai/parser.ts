/**
 * AI Parser - Converts natural language to structured architecture
 * Supports complex multi-region, hub-spoke, and HA scenarios
 */

import type { Architecture, Region, VNet, Subnet, Resource, ResourceGroup, OnPremises, Connection, DiagramPage } from '../schema/types.js';
import { resolveResourceType, RESOURCES, CONTAINER_STYLES } from '../schema/resources.js';

export interface AIProvider {
  name: string;
  parse(prompt: string): Promise<ParsedResponse>;
}

export interface ParsedResponse {
  title?: string;
  description?: string;
  resources: Array<{
    type: string;
    name: string;
    count?: number;
    containedIn?: string;
    region?: string;
    subscription?: string;
    properties?: Record<string, unknown>;
  }>;
  connections?: Array<{
    from: string;
    to: string;
    style?: string;
    label?: string;
  }>;
  regions?: string[];
  subscriptions?: Array<{
    name: string;
    regions?: string[];
  }>;
  hasOnPremises?: boolean;
  architecture?: 'simple' | 'hub-spoke' | 'multi-region' | 'ha' | 'multi-page';
  pages?: Array<{
    name: string;
    description?: string;
    resources: Array<{
      type: string;
      name: string;
      count?: number;
      containedIn?: string;
      region?: string;
      subscription?: string;
      properties?: Record<string, unknown>;
    }>;
    connections?: Array<{
      from: string;
      to: string;
      style?: string;
      label?: string;
    }>;
    regions?: string[];
    hasOnPremises?: boolean;
  }>;
}

/**
 * System prompt for the AI to understand architecture requests
 */
export const SYSTEM_PROMPT = `You are an Azure architecture parser. Convert natural language descriptions into structured JSON for generating Draw.io diagrams.

Output ONLY valid JSON with this structure:
{
  "architecture": "hub-spoke|multi-region|ha|simple",
  "title": "Architecture Title",
  "description": "A comprehensive explanation of this architecture: what it does, why this design was chosen, key design decisions, and important considerations. This should be 3-6 sentences providing valuable context.",
  "regions": ["West Europe", "North Europe"],
  "hasOnPremises": true,
  "subscriptions": [
    { "name": "Hub Subscription", "regions": ["West Europe", "North Europe"] },
    { "name": "Data Platform Subscription", "regions": ["West Europe"] }
  ],
  "resources": [
    { "type": "hubVnet", "name": "vnet-hub-weu", "region": "West Europe", "subscription": "Hub Subscription", "properties": { "addressSpace": "10.0.0.0/16" } },
    { "type": "firewall", "name": "fw-hub-weu", "containedIn": "AzureFirewallSubnet", "region": "West Europe" },
    { "type": "expressRoute", "name": "er-primary", "region": "West Europe", "properties": { "bandwidth": "1 Gbps" } },
    { "type": "vnet", "name": "vnet-spoke-prod", "region": "West Europe", "properties": { "addressSpace": "10.1.0.0/16" } },
    { "type": "vm", "name": "vm-web", "count": 3, "containedIn": "subnet-web", "region": "West Europe", "properties": { "vmSize": "Standard_D4s_v5" } },
    { "type": "fabric", "name": "fabric-analytics", "region": "West Europe", "subscription": "Data Platform Subscription" }
  ],
  "connections": [
    { "from": "er-primary", "to": "On-Premises", "style": "expressroute", "label": "ExpressRoute" },
    { "from": "vnet-hub-weu", "to": "vnet-spoke-prod", "style": "peering" }
  ]
}

Resource types available (use these exact names):
NETWORKING: vnet, hubVnet, subnet, nsg, asg, loadBalancer, appGateway, firewall, firewallPolicy, bastion, vpnGateway, expressRoute, expressRouteDirect, vwan, vhub, privateEndpoint, privateLink, publicIp, publicIpPrefix, nat, frontDoor, trafficManager, cdn, routeTable, routeFilter, localNetworkGateway, connection, ddosProtection, dns, privateDns, networkWatcher, networkManager, nic
COMPUTE: vm, vmss, aks, containerInstance, containerApp, containerAppEnv, containerRegistry, functionApp, appService, appServicePlan, avd, disk, serviceFabric, batch, springApp
SAP: sapHana, sapNetWeaver, sapApp, sapRouter, sapWebDispatcher, hanaLargeInstance
STORAGE: storageAccount, dataLake, netAppFiles, elasticSan
DATABASES: cosmosDb, sqlServer, sqlDatabase, sqlManagedInstance, sqlElasticPool, sqlVm, mysql, postgresql, postgresqlFlex, mariadb, redis, dataExplorer, dms
SECURITY: keyVault, nsg, waf, defender, sentinel, managedIdentity
INTEGRATION: apiManagement, serviceBus, eventHub, eventGrid, logicApp, appConfig, integrationAccount, relay, signalR
AI: openAI, cognitiveServices, machineLearning, botService, aiSearch, aiFoundry, documentIntelligence, speechService, computerVision, languageService, contentSafety
ANALYTICS: databricks, synapse, purview, dataFactory, streamAnalytics, hdInsight, analysisServices, powerBiEmbedded, fabric
MONITORING: appInsights, logAnalytics, grafana, monitor, actionGroup
IDENTITY: azureAd, managedIdentity
IOT: iotHub, iotCentral, digitalTwins
DEVOPS: devops
WEB: staticWebApp, notificationHub, communicationService
MANAGEMENT: recoveryVault, automationAccount, arcMachine, backupCenter, policy, advisor, migrate

Connection styles: solid, dashed, expressroute, vpn, peering

Architecture patterns to recognize:
- "hub and spoke" or "hub-spoke" → Create hub VNET with firewall/gateway, spoke VNETs peered to hub
- "HA" or "high availability" or "dual region" → Create resources in 2 regions with failover
- "ExpressRoute" → Add ER circuit and on-premises connection
- "private endpoint" or "private connectivity" → Use private endpoints for PaaS services
- "zone redundant" or "availability zones" → Distribute VMs/VMSS across availability zones using properties.availabilityZone
- "separate subscription" or "dedicated subscription" → Use the subscriptions array and set the "subscription" field on resources to group them
- "SAP" or "SAP on Azure" → Use sapHana for database VMs, sapApp/sapNetWeaver for application servers, sapWebDispatcher for web dispatchers, sapRouter for routers. SAP typically needs: large VMs (M-series for HANA, E-series for app), ANF/NetApp Files or Elastic SAN for shared storage, proximity placement groups, availability sets/zones
- "AVD" or "Virtual Desktop" → Use avd type. Typically includes: host pool VMs, session hosts, Azure Files/NetApp for profiles, Active Directory

Rules:
1. Hub VNETs get: GatewaySubnet, AzureFirewallSubnet, AzureBastionSubnet — always include firewall, bastion, and VPN gateway resources in those subnets
2. Spoke VNETs get: subnet-web, subnet-app, subnet-data (or as specified)
3. For HA: mirror resources in both regions
4. VMs/VMSS go in subnets; databases/storage at resource group level
5. Use descriptive suffixes: -weu, -neu, -eus, etc. for regional resources
6. Default address spaces: Hub 10.0.0.0/16, Spokes 10.1.0.0/16, 10.2.0.0/16, etc.
7. When user mentions "separate subscription", add a subscriptions array and tag resources with the subscription name
8. If no subscriptions are specified, omit the subscriptions array entirely
9. Multi-region hub-spoke: ALWAYS add a global VNet peering connection between hub VNets across regions
10. When user mentions "availability zones" or multiple VMs, distribute them across zones by setting properties.availabilityZone to 1, 2, or 3 on each VM/VMSS. Round-robin assign: first VM gets zone 1, second gets zone 2, third gets zone 3, fourth gets zone 1, etc.
11. ALWAYS include detailed properties on resources even when the user doesn't specify them — make smart suggestions:
    - VMs: vmSize (suggest Standard_D4s_v5 for general, Standard_E16s_v5 for memory-intensive, Standard_M64s for SAP HANA)
    - VNETs: addressSpace (use 10.x.0.0/16 pattern)
    - Subnets: addressPrefix (use 10.x.y.0/24 pattern, appropriately sized)
    - AKS: nodeCount, vmSize (suggest Standard_D4s_v5)
    - SQL Database: sku, tier (suggest Standard S3 or Premium P1)
    - Storage: kind (StorageV2), sku (Standard_LRS or Standard_GRS)
    - App Gateway: sku (WAF_v2), tier (Standard_v2)
    - ExpressRoute: bandwidth (1 Gbps or 2 Gbps)  
    - Redis: sku (Standard), capacity (C1)
    - VMSS: capacity (3), vmSize
    - NetApp Files: tier (Premium), capacity (4 TiB)
    - Elastic SAN: tier (Premium), capacity (1 TiB)
    - SAP HANA VMs: vmSize (Standard_M64s or Standard_M128s)
    - AVD: maxSessions (10), vmSize (Standard_D4s_v5)
    These will be displayed as labels on the diagram.
12. When the user mentions "pages", "tabs", "layers", or "separate views", create a multi-page diagram using the "pages" array. Each page has a name and its own resources and connections. Example: "pages": [{"name": "Network Overview", "resources": [...], "connections": [...]}, {"name": "Application Layer", "resources": [...], "connections": [...]}]. Common page splits: "Network" + "Application" + "Data", or one page per region.
13. If no pages are requested, do NOT use the pages array — use the flat structure.
14. ALWAYS include a "title" and "description" field. The description should explain what this architecture does, why key design choices were made, and important considerations (3-6 sentences). For multi-page diagrams, also include a "description" field on each page explaining what that specific page/view shows.

Only output the JSON, no explanation.`;

/**
 * Parse the AI response into an Architecture object
 */
export function parseAIResponse(response: ParsedResponse, title?: string): Architecture {
  // Multi-page handling
  if (response.pages && response.pages.length > 0) {
    const arch: Architecture = {
      title: title || response.title || 'Azure Architecture',
      description: response.description,
      pages: response.pages.map(page => {
        const pageResponse: ParsedResponse = {
          resources: page.resources || [],
          connections: page.connections,
          regions: page.regions,
          hasOnPremises: page.hasOnPremises,
        };
        const pageRegions = page.regions || [];
        const isMultiRegion = pageRegions.length > 1;

        if (isMultiRegion) {
          return {
            name: page.name,
            description: page.description,
            regions: pageRegions.map(regionName => buildRegion(regionName, pageResponse)),
            connections: pageResponse.connections?.map(c => ({
              from: c.from,
              to: c.to,
              label: c.label,
              style: c.style as any,
            })) || [],
            onPremises: page.hasOnPremises ? [{
              name: 'On-Premises Datacenter',
              resources: [],
            }] : undefined,
          };
        } else {
          return {
            name: page.name,
            description: page.description,
            resourceGroups: buildResourceGroups(pageResponse, pageRegions[0]),
            connections: pageResponse.connections?.map(c => ({
              from: c.from,
              to: c.to,
              label: c.label,
              style: c.style as any,
            })) || [],
            onPremises: page.hasOnPremises ? [{
              name: 'On-Premises Datacenter',
              resources: [],
            }] : undefined,
          };
        }
      }),
    };
    return arch;
  }

  const arch: Architecture = {
    title: title || response.title || 'Azure Architecture',
    description: response.description,
    connections: [],
  };

  // Determine architecture type
  const isMultiRegion = response.regions && response.regions.length > 1;
  const hasMultiSub = response.subscriptions && response.subscriptions.length > 1;
  const hasOnPrem = response.hasOnPremises;

  if (hasMultiSub) {
    // Multi-subscription architecture
    arch.subscriptions = response.subscriptions!.map(sub => {
      const subRegions = sub.regions || response.regions || ['West Europe'];
      const subResources = response.resources.filter(r => r.subscription === sub.name);
      const subResponse: ParsedResponse = { ...response, resources: subResources };

      if (subRegions.length > 1) {
        // Multi-region within this subscription
        return {
          name: sub.name,
          regions: subRegions.map(regionName => buildRegion(regionName, subResponse)),
        };
      } else {
        return {
          name: sub.name,
          resourceGroups: buildResourceGroups(subResponse, subRegions[0]),
        };
      }
    });

    // Resources without a subscription tag go to a default subscription
    const untaggedResources = response.resources.filter(r => !r.subscription);
    if (untaggedResources.length > 0) {
      const defaultSubResponse: ParsedResponse = { ...response, resources: untaggedResources };
      if (isMultiRegion) {
        const defaultSub = {
          name: 'Azure Subscription',
          regions: response.regions!.map(regionName => buildRegion(regionName, defaultSubResponse)),
        };
        arch.subscriptions.unshift(defaultSub);
      } else {
        const defaultSub = {
          name: 'Azure Subscription',
          resourceGroups: buildResourceGroups(defaultSubResponse, response.regions?.[0]),
        };
        arch.subscriptions.unshift(defaultSub);
      }
    }
  } else if (isMultiRegion) {
    arch.regions = response.regions!.map(regionName => buildRegion(regionName, response));
  } else {
    // Single region or simple architecture
    arch.subscription = {
      name: 'Azure Subscription',
      resourceGroups: buildResourceGroups(response, response.regions?.[0]),
    };
  }

  // Handle on-premises
  if (hasOnPrem) {
    arch.onPremises = [{
      name: 'On-Premises Datacenter',
      resources: response.resources
        .filter(r => r.type === 'localNetworkGateway' || r.containedIn === 'onPremises')
        .map(r => ({
          type: resolveResourceType(r.type) || r.type,
          name: r.name,
          properties: r.properties,
        })),
    }];
  }

  // Handle global resources (Front Door, Traffic Manager, DNS)
  const globalTypes = ['frontDoor', 'trafficManager', 'dns', 'privateDns', 'cdn'];
  arch.globalResources = response.resources
    .filter(r => globalTypes.includes(resolveResourceType(r.type) || r.type))
    .map(r => ({
      type: resolveResourceType(r.type) || r.type,
      name: r.name,
      properties: r.properties,
    }));

  // Parse connections
  arch.connections = response.connections?.map(c => ({
    from: c.from,
    to: c.to,
    label: c.label,
    style: c.style as any,
  })) || [];

  // Auto-add hub-to-hub global VNet peering for multi-region hub-spoke
  if (isMultiRegion && response.regions && response.regions.length >= 2) {
    const hubVnets = response.resources
      .filter(r => (resolveResourceType(r.type) || r.type) === 'hubVnet')
      .map(r => r.name);
    
    // Connect all hub VNets to each other if not already connected
    for (let i = 0; i < hubVnets.length; i++) {
      for (let j = i + 1; j < hubVnets.length; j++) {
        const alreadyConnected = arch.connections.some(c =>
          (c.from === hubVnets[i] && c.to === hubVnets[j]) ||
          (c.from === hubVnets[j] && c.to === hubVnets[i])
        );
        if (!alreadyConnected) {
          arch.connections.push({
            from: hubVnets[i],
            to: hubVnets[j],
            label: 'Global VNet Peering',
            style: 'peering' as any,
          });
        }
      }
    }
  }

  return arch;
}

function buildRegion(regionName: string, response: ParsedResponse): Region {
  const regionResources = response.resources.filter(r => r.region === regionName);
  
  return {
    name: regionName,
    code: regionNameToCode(regionName),
    isPrimary: regionName.toLowerCase().includes('primary') || 
               response.regions?.indexOf(regionName) === 0,
    resourceGroups: buildResourceGroups({ ...response, resources: regionResources }, regionName),
  };
}

function buildResourceGroups(response: ParsedResponse, region?: string): ResourceGroup[] {
  const resourceMap = new Map<string, Resource>();
  const vnets: VNet[] = [];
  const subnets: Subnet[] = [];
  const otherResources: Resource[] = [];

  // First pass: categorize resources
  for (const res of response.resources) {
    const type = resolveResourceType(res.type) || res.type;
    const count = res.count || 1;

    for (let i = 0; i < count; i++) {
      const name = count > 1 
        ? `${res.name.replace(/-?\d+$/, '')}-${String(i + 1).padStart(2, '0')}`
        : res.name;

      const resource: Resource = {
        type,
        name,
        properties: res.properties,
        containedIn: res.containedIn,
      };

      resourceMap.set(name, resource);

      if (type === 'vnet' || type === 'hubVnet') {
        vnets.push(resource as VNet);
      } else if (type === 'subnet') {
        subnets.push(resource as Subnet);
      } else {
        otherResources.push(resource);
      }
    }
  }

  // Second pass: organize hierarchy
  // Attach subnets to VNETs
  for (const subnet of subnets) {
    const parentName = (subnet as Resource).containedIn;
    if (parentName) {
      const vnet = vnets.find(v => v.name === parentName);
      if (vnet) {
        vnet.subnets = vnet.subnets || [];
        vnet.subnets.push(subnet);
        subnet.resources = [];
      }
    }
  }

  // Auto-create subnets for hub VNETs if not specified
  for (const vnet of vnets.filter(v => v.type === 'hubVnet')) {
    if (!vnet.subnets || vnet.subnets.length === 0) {
      vnet.subnets = [
        { type: 'subnet', name: 'AzureFirewallSubnet', addressPrefix: '10.0.1.0/24', resources: [] },
        { type: 'subnet', name: 'GatewaySubnet', addressPrefix: '10.0.2.0/24', resources: [] },
        { type: 'subnet', name: 'AzureBastionSubnet', addressPrefix: '10.0.3.0/24', resources: [] },
      ];
    }

    // Auto-add bastion if AzureBastionSubnet is empty
    const bastionSubnet = vnet.subnets?.find(s => s.name === 'AzureBastionSubnet');
    if (bastionSubnet && (!bastionSubnet.resources || bastionSubnet.resources.length === 0)) {
      const suffix = vnet.name.replace(/^vnet-hub-?/, '') || 'main';
      bastionSubnet.resources = bastionSubnet.resources || [];
      bastionSubnet.resources.push({
        type: 'bastion',
        name: `bas-hub-${suffix}`,
      });
    }
  }

  // Attach resources to subnets or keep at RG level
  const rgLevelResources: Resource[] = [];
  
  for (const resource of otherResources) {
    if (resource.containedIn) {
      // Find the subnet
      let placed = false;
      for (const vnet of vnets) {
        const subnet = vnet.subnets?.find(s => s.name === resource.containedIn);
        if (subnet) {
          subnet.resources = subnet.resources || [];
          subnet.resources.push(resource);
          placed = true;
          break;
        }
      }
      if (placed) continue;
    }
    
    // Check if this type should be in a subnet
    const def = RESOURCES[resource.type];
    if (def?.containedBy?.includes('subnet') && !def.containedBy?.includes('resourceGroup')) {
      // Place in first appropriate subnet
      for (const vnet of vnets) {
        if (vnet.subnets && vnet.subnets.length > 0) {
          // Match firewall to AzureFirewallSubnet, bastion to AzureBastionSubnet, etc.
          let targetSubnet = vnet.subnets[0];
          if (resource.type === 'firewall') {
            targetSubnet = vnet.subnets.find(s => s.name === 'AzureFirewallSubnet') || targetSubnet;
          } else if (resource.type === 'bastion') {
            targetSubnet = vnet.subnets.find(s => s.name === 'AzureBastionSubnet') || targetSubnet;
          } else if (resource.type === 'vpnGateway') {
            targetSubnet = vnet.subnets.find(s => s.name === 'GatewaySubnet') || targetSubnet;
          }
          targetSubnet.resources = targetSubnet.resources || [];
          targetSubnet.resources.push(resource);
          break;
        }
      }
    } else {
      rgLevelResources.push(resource);
    }
  }

  // Group resources by purpose
  const suffix = region ? `-${regionNameToCode(region)}` : '';
  const groups: ResourceGroup[] = [];

  // Hub resources
  const hubVnets = vnets.filter(v => v.type === 'hubVnet');
  if (hubVnets.length > 0) {
    groups.push({
      name: `rg-hub${suffix}`,
      resources: [
        ...hubVnets,
        ...rgLevelResources.filter(r => ['expressRoute', 'publicIp', 'routeTable', 'ddosProtection'].includes(r.type)),
      ],
    });
  }

  // Spoke/workload resources
  const spokeVnets = vnets.filter(v => v.type === 'vnet' || v.type !== 'hubVnet');
  if (spokeVnets.length > 0) {
    groups.push({
      name: `rg-workload${suffix}`,
      resources: [
        ...spokeVnets,
        ...rgLevelResources.filter(r => ['nsg', 'asg'].includes(r.type)),
      ],
    });
  }

  // Shared services (databases, storage, etc.)
  const sharedResources = rgLevelResources.filter(r => 
    ['storageAccount', 'cosmosDb', 'sqlServer', 'sqlDatabase', 'keyVault', 'redis', 
     'containerRegistry', 'recoveryVault', 'openAI', 'machineLearning'].includes(r.type)
  );
  if (sharedResources.length > 0) {
    groups.push({
      name: `rg-shared${suffix}`,
      resources: sharedResources,
    });
  }

  // Catch-all: any remaining resources not yet assigned to a group
  const assignedResources = new Set([
    ...groups.flatMap(g => g.resources.map(r => r.name)),
  ]);
  const unassigned = rgLevelResources.filter(r => !assignedResources.has(r.name));
  if (unassigned.length > 0) {
    // If there are no other groups yet, name it rg-main; otherwise rg-services
    const catchAllName = groups.length === 0 ? `rg-main${suffix}` : `rg-services${suffix}`;
    groups.push({
      name: catchAllName,
      resources: unassigned,
    });
  }

  // If no groups were created, create a default one
  if (groups.length === 0) {
    groups.push({
      name: `rg-main${suffix}`,
      resources: [...vnets, ...rgLevelResources],
    });
  }

  // Post-process: group resources with availabilityZone into AZ containers within subnets
  for (const group of groups) {
    for (const res of group.resources) {
      const vnet = res as VNet;
      if (vnet.subnets) {
        for (const subnet of vnet.subnets) {
          if (!subnet.resources) continue;
          const zonedResources = subnet.resources.filter(r => 
            r.properties?.availabilityZone !== undefined
          );
          if (zonedResources.length === 0) continue;

          // Group by zone
          const zoneMap = new Map<number, Resource[]>();
          for (const r of zonedResources) {
            const zone = Number(r.properties!.availabilityZone);
            if (!zoneMap.has(zone)) zoneMap.set(zone, []);
            zoneMap.get(zone)!.push(r);
          }

          // Only create AZ containers if there are multiple zones
          if (zoneMap.size > 1) {
            // Remove zoned resources from the flat list
            subnet.resources = subnet.resources.filter(r => 
              r.properties?.availabilityZone === undefined
            );
            // Create AZ groups
            subnet.availabilityZones = Array.from(zoneMap.entries())
              .sort(([a], [b]) => a - b)
              .map(([zone, resources]) => ({ zone, resources }));
          }
        }
      }
    }
  }

  return groups;
}

function regionNameToCode(name: string): string {
  const codes: Record<string, string> = {
    'west europe': 'weu',
    'north europe': 'neu',
    'east us': 'eus',
    'east us 2': 'eus2',
    'west us': 'wus',
    'west us 2': 'wus2',
    'central us': 'cus',
    'uk south': 'uks',
    'uk west': 'ukw',
    'germany west central': 'gwc',
    'france central': 'frc',
    'sweden central': 'swc',
    'norway east': 'noe',
    'switzerland north': 'chn',
    'australia east': 'aue',
    'southeast asia': 'sea',
    'japan east': 'jpe',
  };
  return codes[name.toLowerCase()] || name.toLowerCase().replace(/\s+/g, '').substring(0, 3);
}
