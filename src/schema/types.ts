/**
 * TypeScript types for architecture definitions
 * Supports complex multi-region, hub-spoke, and HA architectures
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseResource {
  id?: string;
  type: string;
  name: string;
  properties?: Record<string, unknown>;
  position?: Position;
  size?: Size;
  connectedTo?: string[];
}

export interface Resource extends BaseResource {
  containedIn?: string;  // ID or name of parent container
}

export interface Subnet extends BaseResource {
  type: 'subnet';
  addressPrefix?: string;
  resources?: Resource[];
  nsg?: string;  // Reference to NSG
}

export interface VNet extends BaseResource {
  type: 'vnet' | 'hubVnet';
  addressSpace?: string;
  subnets?: Subnet[];
  peerings?: VNetPeering[];
}

export interface VNetPeering {
  name: string;
  remoteVnet: string;  // Name or ID of remote VNET
  allowGatewayTransit?: boolean;
  useRemoteGateways?: boolean;
}

export interface ResourceGroup {
  id?: string;
  name: string;
  resources: (Resource | VNet)[];
  position?: Position;
  size?: Size;
}

export interface Region {
  id?: string;
  name: string;  // e.g., "West Europe", "East US"
  code?: string; // e.g., "westeurope", "eastus"
  resourceGroups?: ResourceGroup[];
  resources?: (Resource | VNet)[];  // Direct resources if no RG needed
  isPrimary?: boolean;
  position?: Position;
  size?: Size;
}

export interface Subscription {
  id?: string;
  name: string;
  resourceGroups?: ResourceGroup[];
  regions?: Region[];  // For multi-region architectures
  position?: Position;
  size?: Size;
}

export interface OnPremises {
  id?: string;
  name: string;
  location?: string;  // e.g., "Datacenter 1"
  resources?: Resource[];
  position?: Position;
  size?: Size;
}

export interface Architecture {
  title?: string;
  description?: string;
  subscription?: Subscription;
  subscriptions?: Subscription[];  // Multi-subscription
  regions?: Region[];  // Alternative: regions at top level
  onPremises?: OnPremises[];  // On-premises locations
  connections?: Connection[];
  globalResources?: Resource[];  // Resources outside regions (Traffic Manager, Front Door)
}

export interface Connection {
  from: string;  // Resource ID or name
  to: string;    // Resource ID or name
  label?: string;
  style?: 'solid' | 'dashed' | 'expressroute' | 'vpn' | 'peering';
  bidirectional?: boolean;
}

// ==================== LAYOUT TYPES ====================

export interface LayoutNode {
  id: string;
  type: string;
  name: string;
  parentId?: string;
  children: LayoutNode[];
  position: Position;
  size: Size;
  isContainer: boolean;
}

// ==================== AI PARSER TYPES ====================

export interface ParsedArchitecture {
  resources: ParsedResource[];
  connections: ParsedConnection[];
  regions?: string[];
  isMultiRegion?: boolean;
  hasOnPremises?: boolean;
}

export interface ParsedResource {
  type: string;
  name: string;
  count?: number;
  containedIn?: string;
  region?: string;
  availabilityZone?: number;
  properties?: Record<string, unknown>;
}

export interface ParsedConnection {
  from: string;
  to: string;
  type?: 'network' | 'data' | 'api' | 'expressroute' | 'vpn' | 'peering';
  label?: string;
}

// ==================== TEMPLATE TYPES ====================

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  architecture: Architecture;
}

// ==================== COMMON PATTERNS ====================

export type HubSpokeConfig = {
  hub: {
    name: string;
    region: string;
    hasFirewall?: boolean;
    hasVpnGateway?: boolean;
    hasExpressRoute?: boolean;
    hasBastion?: boolean;
  };
  spokes: Array<{
    name: string;
    purpose: string;  // e.g., "production", "dev", "shared-services"
    resources?: Resource[];
  }>;
};

export type HAConfig = {
  primaryRegion: string;
  secondaryRegion: string;
  replicationType?: 'active-active' | 'active-passive';
  trafficDistribution?: 'traffic-manager' | 'front-door' | 'load-balancer';
};

export type ThreeTierConfig = {
  webTier: {
    vmCount?: number;
    useAppGateway?: boolean;
    useVmss?: boolean;
  };
  appTier: {
    vmCount?: number;
    useAks?: boolean;
  };
  dataTier: {
    database: 'sql' | 'cosmos' | 'mysql' | 'postgresql';
    usePrivateEndpoint?: boolean;
  };
};
