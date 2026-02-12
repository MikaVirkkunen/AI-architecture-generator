/**
 * Draw.io XML Builder
 * Generates valid .drawio XML files for Azure architecture diagrams
 * Supports multi-region, hub-spoke, and complex HA architectures
 */

import { create } from 'xmlbuilder2';
import { generateCellId, resetCounter } from '../utils/id-generator.js';
import { RESOURCES, CONTAINER_STYLES, type ResourceDefinition } from '../schema/resources.js';
import type { Architecture, Resource, Subscription, ResourceGroup, Region, VNet, Subnet, Connection, Position, OnPremises } from '../schema/types.js';

interface CellInfo {
  id: string;
  parentId: string;
  position: Position;
}

export class DrawIOBuilder {
  private cellMap: Map<string, CellInfo> = new Map();
  private idCounter = 0;

  constructor() {
    resetCounter();
  }

  /**
   * Generate a complete .drawio XML file from an architecture definition
   */
  public generate(arch: Architecture): string {
    this.cellMap.clear();
    this.idCounter = 0;

    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('mxfile', {
        host: 'app.diagrams.net',
        modified: new Date().toISOString(),
        agent: 'az-arch-gen',
        version: '1.0.0',
        type: 'device',
      });

    const diagram = doc.ele('diagram', {
      id: generateCellId('diagram'),
      name: arch.title || 'Azure Architecture',
    });

    // Calculate page size based on content
    const pageWidth = this.estimatePageWidth(arch);
    const pageHeight = this.estimatePageHeight(arch);

    const mxGraphModel = diagram.ele('mxGraphModel', {
      dx: '1426',
      dy: '798',
      grid: '1',
      gridSize: '10',
      guides: '1',
      tooltips: '1',
      connect: '1',
      arrows: '1',
      fold: '1',
      page: '1',
      pageScale: '1',
      pageWidth: String(pageWidth),
      pageHeight: String(pageHeight),
      math: '0',
      shadow: '0',
    });

    const root = mxGraphModel.ele('root');
    
    // Required base cells
    root.ele('mxCell', { id: '0' });
    root.ele('mxCell', { id: '1', parent: '0' });

    let currentX = 50;
    let currentY = 50;
    let maxCloudHeight = 0;
    let totalCloudWidth = 0;

    // Handle multi-region architecture
    if (arch.regions && arch.regions.length > 0) {
      for (const region of arch.regions) {
        const regionHeight = this.calculateRegionHeight(region);
        maxCloudHeight = Math.max(maxCloudHeight, regionHeight);
        this.buildRegion(root, region, { x: currentX, y: currentY });
        const regionWidth = this.calculateRegionWidth(region);
        currentX += regionWidth + 80;
        totalCloudWidth = currentX;
      }
    } 
    // Handle subscription-based architecture
    else if (arch.subscription) {
      maxCloudHeight = this.calculateSubscriptionHeight(arch.subscription);
      this.buildSubscription(root, arch.subscription, { x: currentX, y: currentY });
      totalCloudWidth = this.calculateSubscriptionWidth(arch.subscription);
    }
    // Handle multiple subscriptions
    else if (arch.subscriptions) {
      for (const sub of arch.subscriptions) {
        const subHeight = this.calculateSubscriptionHeight(sub);
        maxCloudHeight = Math.max(maxCloudHeight, subHeight);
        this.buildSubscription(root, sub, { x: currentX, y: currentY });
        currentX += this.calculateSubscriptionWidth(sub) + 80;
        totalCloudWidth = currentX;
      }
    }

    // Handle on-premises — position below ALL cloud content, centred horizontally
    if (arch.onPremises && arch.onPremises.length > 0) {
      const onPremY = currentY + maxCloudHeight + 60;
      // Centre the on-prem box(es) relative to the cloud content
      const totalOnPremWidth = arch.onPremises.length * 400;
      let onPremX = Math.max(50, Math.floor((totalCloudWidth - totalOnPremWidth) / 2));
      for (const onPrem of arch.onPremises) {
        this.buildOnPremises(root, onPrem, { x: onPremX, y: onPremY });
        onPremX += 400;
      }
    }

    // Handle global resources (Front Door, Traffic Manager, etc.)
    if (arch.globalResources && arch.globalResources.length > 0) {
      this.buildGlobalResources(root, arch.globalResources, { x: 50, y: 10 });
    }

    // Add connections
    if (arch.connections) {
      this.buildConnections(root, arch.connections);
    }

    return doc.end({ prettyPrint: true });
  }

  private nextId(): string {
    return `cell-${++this.idCounter}`;
  }

  // ==================== REGION BUILDING ====================

  private buildRegion(parent: any, region: Region, pos: Position, containerId: string = '1'): void {
    const id = region.id || this.nextId();
    const width = this.calculateRegionWidth(region);
    const height = this.calculateRegionHeight(region);

    // Region container
    this.addContainer(parent, {
      id,
      parentId: containerId,
      value: region.name + (region.isPrimary ? ' (Primary)' : ''),
      style: CONTAINER_STYLES.region,
      x: pos.x,
      y: pos.y,
      width,
      height,
    });

    this.cellMap.set(region.name, { id, parentId: containerId, position: pos });

    // Build resource groups within region
    let rgX = 30;
    let rgY = 50;

    if (region.resourceGroups) {
      for (const rg of region.resourceGroups) {
        this.buildResourceGroup(parent, rg, id, { x: rgX, y: rgY });
        rgY += this.calculateRGHeight(rg) + 40;
      }
    }

    // Build direct resources (if any)
    if (region.resources) {
      this.buildResourceList(parent, region.resources, id, { x: rgX, y: rgY });
    }
  }

  // ==================== SUBSCRIPTION BUILDING ====================

  private buildSubscription(parent: any, sub: Subscription, pos: Position): void {
    const id = sub.id || this.nextId();
    const width = this.calculateSubscriptionWidth(sub);
    const height = this.calculateSubscriptionHeight(sub);

    // Subscription container
    this.addContainer(parent, {
      id,
      parentId: '1',
      value: sub.name || 'Subscription',
      style: CONTAINER_STYLES.subscription,
      x: pos.x,
      y: pos.y,
      width,
      height,
    });

    // Add subscription icon
    this.addIcon(parent, {
      parentId: id,
      icon: RESOURCES.subscription.icon,
      x: 10,
      y: 30,
      width: 44,
      height: 71,
    });

    this.cellMap.set(sub.name || 'subscription', { id, parentId: '1', position: pos });

    // Build resource groups
    let rgX = 70;
    let rgY = 50;

    // If subscription has regions, build them inside
    if (sub.regions && sub.regions.length > 0) {
      let regionX = 70;
      for (const region of sub.regions) {
        this.buildRegion(parent, region, { x: regionX, y: rgY }, id);
        regionX += this.calculateRegionWidth(region) + 60;
      }
    } else if (sub.resourceGroups) {
      for (const rg of sub.resourceGroups) {
        this.buildResourceGroup(parent, rg, id, { x: rgX, y: rgY });
        rgX += this.calculateRGWidth(rg) + 40;
      }
    }
  }

  // ==================== RESOURCE GROUP BUILDING ====================

  private buildResourceGroup(parent: any, rg: ResourceGroup, containerId: string, pos: Position): void {
    const id = rg.id || this.nextId();
    const width = this.calculateRGWidth(rg);
    const height = this.calculateRGHeight(rg);

    // RG container
    this.addContainer(parent, {
      id,
      parentId: containerId,
      value: rg.name || 'Resource Group',
      style: CONTAINER_STYLES.resourceGroup,
      x: pos.x,
      y: pos.y,
      width,
      height,
    });

    this.cellMap.set(rg.name || `rg-${id}`, { id, parentId: containerId, position: pos });

    // Separate VNETs from other resources
    const vnets = rg.resources.filter(r => r.type === 'vnet' || r.type === 'hubVnet') as VNet[];
    const otherResources = rg.resources.filter(r => r.type !== 'vnet' && r.type !== 'hubVnet');

    // Build VNETs first
    let vnetY = 40;
    for (const vnet of vnets) {
      this.buildVNet(parent, vnet, id, { x: 20, y: vnetY });
      vnetY += this.calculateVNetHeight(vnet) + 30;
    }

    // Build other resources in a grid
    const gridStartX = vnets.length > 0 ? Math.max(...vnets.map(v => this.calculateVNetWidth(v))) + 50 : 20;
    let resX = gridStartX;
    let resY = 50;
    const rowHeight = 110;
    const colWidth = 130;
    let col = 0;
    const maxCols = 4;

    for (const resource of otherResources) {
      this.buildResource(parent, resource, id, { x: resX + col * colWidth, y: resY });
      col++;
      if (col >= maxCols) {
        col = 0;
        resY += rowHeight;
      }
    }
  }

  // ==================== VNET BUILDING ====================

  private buildVNet(parent: any, vnet: VNet, rgId: string, pos: Position): void {
    const id = vnet.id || this.nextId();
    const width = this.calculateVNetWidth(vnet);
    const height = this.calculateVNetHeight(vnet);

    // Determine style based on VNET type
    const style = vnet.type === 'hubVnet' ? CONTAINER_STYLES.vnetHub : CONTAINER_STYLES.vnet;
    const addressSpace = vnet.addressSpace || vnet.properties?.addressSpace as string;

    // VNET container
    this.addContainer(parent, {
      id,
      parentId: rgId,
      value: `${vnet.name}${addressSpace ? `\n(${addressSpace})` : ''}`,
      style,
      x: pos.x,
      y: pos.y,
      width,
      height,
    });

    // Add VNET icon
    this.addIcon(parent, {
      parentId: id,
      icon: RESOURCES.vnet.icon,
      x: width - 80,
      y: 5,
      width: 67,
      height: 40,
    });

    this.cellMap.set(vnet.name, { id, parentId: rgId, position: pos });

    // Build subnets
    if (vnet.subnets) {
      let subnetX = 20;
      let subnetY = 50;
      const subnetSpacing = 20;
      
      // For hub VNETs, arrange subnets horizontally
      const isHub = vnet.type === 'hubVnet';
      
      for (const subnet of vnet.subnets) {
        this.buildSubnet(parent, subnet, id, { x: subnetX, y: subnetY });
        
        if (isHub) {
          subnetX += this.calculateSubnetWidth(subnet) + subnetSpacing;
        } else {
          subnetY += this.calculateSubnetHeight(subnet) + subnetSpacing;
        }
      }
    }
  }

  // ==================== SUBNET BUILDING ====================

  private buildSubnet(parent: any, subnet: Subnet, vnetId: string, pos: Position): void {
    const id = subnet.id || this.nextId();
    const width = this.calculateSubnetWidth(subnet);
    const height = this.calculateSubnetHeight(subnet);
    const addressPrefix = subnet.addressPrefix || subnet.properties?.addressPrefix as string;

    // Subnet container
    this.addContainer(parent, {
      id,
      parentId: vnetId,
      value: `${subnet.name}${addressPrefix ? `\n(${addressPrefix})` : ''}`,
      style: CONTAINER_STYLES.subnet,
      x: pos.x,
      y: pos.y,
      width,
      height,
    });

    this.cellMap.set(subnet.name, { id, parentId: vnetId, position: pos });

    // Build resources in subnet
    if (subnet.resources) {
      let resX = 15;
      let resY = 45;
      const colWidth = 130;
      let col = 0;
      const maxCols = Math.max(2, Math.floor((width - 30) / colWidth));

      for (const resource of subnet.resources) {
        this.buildResource(parent, resource, id, { x: resX + col * colWidth, y: resY });
        col++;
        if (col >= maxCols) {
          col = 0;
          resY += 110;
        }
      }
    }
  }

  // ==================== ON-PREMISES BUILDING ====================

  private buildOnPremises(parent: any, onPrem: OnPremises, pos: Position): void {
    const id = onPrem.id || this.nextId();
    const width = 350;
    const height = Math.max(200, (onPrem.resources?.length || 0) * 90 + 80);

    // On-premises container
    this.addContainer(parent, {
      id,
      parentId: '1',
      value: onPrem.name || 'On-Premises',
      style: CONTAINER_STYLES.onPremises,
      x: pos.x,
      y: pos.y,
      width,
      height,
    });

    // Add on-premises icon
    this.addIcon(parent, {
      parentId: id,
      icon: RESOURCES.onPremises.icon,
      x: 20,
      y: 40,
      width: 80,
      height: 138,
    });

    this.cellMap.set(onPrem.name || 'On-Premises Datacenter', { id, parentId: '1', position: pos });

    // Build resources
    if (onPrem.resources) {
      let resY = 50;
      for (const resource of onPrem.resources) {
        this.buildResource(parent, resource, id, { x: 120, y: resY });
        resY += 85;
      }
    }
  }

  // ==================== GLOBAL RESOURCES ====================

  private buildGlobalResources(parent: any, resources: Resource[], pos: Position): void {
    let x = pos.x;
    for (const resource of resources) {
      this.buildResource(parent, resource, '1', { x, y: pos.y });
      x += 100;
    }
  }

  // ==================== RESOURCE BUILDING ====================

  private buildResource(parent: any, resource: Resource, parentId: string, pos: Position): void {
    const def = RESOURCES[resource.type];
    if (!def) {
      console.warn(`Unknown resource type: ${resource.type}`);
      return;
    }

    const id = resource.id || this.nextId();

    // Resource with object wrapper for properties
    const obj = parent.ele('object', {
      label: resource.name,
      id,
    });

    // Add custom properties
    if (resource.properties) {
      for (const [key, value] of Object.entries(resource.properties)) {
        if (value !== null && value !== undefined) {
          obj.att(key.replace(/\s+/g, '_'), String(value));
        }
      }
    }

    // Add the cell — label below icon, smaller font to avoid overlap
    const style = `aspect=fixed;html=1;points=[];align=center;image;fontSize=11;imageAlign=center;verticalLabelPosition=bottom;verticalAlign=top;image=${def.icon};`;
    
    obj.ele('mxCell', {
      style,
      vertex: '1',
      parent: parentId,
    }).ele('mxGeometry', {
      x: String(pos.x),
      y: String(pos.y),
      width: String(def.width),
      height: String(def.height),
      as: 'geometry',
    });

    this.cellMap.set(resource.name, { id, parentId, position: pos });
  }

  private buildResourceList(parent: any, resources: Resource[], parentId: string, pos: Position): void {
    let x = pos.x;
    let y = pos.y;
    let col = 0;
    const maxCols = 4;

    for (const resource of resources) {
      this.buildResource(parent, resource, parentId, { x: x + col * 130, y });
      col++;
      if (col >= maxCols) {
        col = 0;
        y += 110;
      }
    }
  }

  // ==================== CONNECTIONS ====================

  private buildConnections(parent: any, connections: Connection[]): void {
    for (const conn of connections) {
      const from = this.findCell(conn.from);
      const to = this.findCell(conn.to);

      if (!from || !to) {
        console.warn(`Cannot create connection: ${conn.from} -> ${conn.to} (resource not found)`);
        continue;
      }

      let style = 'edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;fontSize=10;labelBackgroundColor=#FFFFFF;';
      
      switch (conn.style) {
        case 'dashed':
          style += 'dashed=1;';
          break;
        case 'expressroute':
          style += 'strokeColor=#FF6600;strokeWidth=3;';
          break;
        case 'vpn':
          style += 'strokeColor=#0066CC;strokeWidth=2;dashed=1;';
          break;
        case 'peering':
          style += 'strokeColor=#009900;strokeWidth=2;endArrow=none;';
          break;
      }

      parent.ele('mxCell', {
        id: this.nextId(),
        value: conn.label || '',
        style,
        edge: '1',
        parent: '1',
        source: from.id,
        target: to.id,
      }).ele('mxGeometry', {
        relative: '1',
        as: 'geometry',
      });
    }
  }

  // ==================== HELPERS ====================

  private addContainer(parent: any, opts: {
    id: string;
    parentId: string;
    value: string;
    style: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }): void {
    parent.ele('mxCell', {
      id: opts.id,
      value: opts.value,
      style: opts.style,
      vertex: '1',
      parent: opts.parentId,
    }).ele('mxGeometry', {
      x: String(opts.x),
      y: String(opts.y),
      width: String(opts.width),
      height: String(opts.height),
      as: 'geometry',
    });
  }

  private addIcon(parent: any, opts: {
    parentId: string;
    icon: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
  }): void {
    parent.ele('mxCell', {
      id: this.nextId(),
      value: opts.label || '',
      style: `aspect=fixed;html=1;points=[];align=center;image;fontSize=12;image=${opts.icon};`,
      vertex: '1',
      parent: opts.parentId,
    }).ele('mxGeometry', {
      x: String(opts.x),
      y: String(opts.y),
      width: String(opts.width),
      height: String(opts.height),
      as: 'geometry',
    });
  }

  /** Look up a cell by exact name, then try case-insensitive / partial matching */
  private findCell(name: string): CellInfo | undefined {
    // Exact match
    if (this.cellMap.has(name)) return this.cellMap.get(name);

    // Case-insensitive match
    const lower = name.toLowerCase();
    for (const [key, val] of this.cellMap) {
      if (key.toLowerCase() === lower) return val;
    }

    // Partial / contains match (e.g. "On-Premises" matches "On-Premises Datacenter")
    for (const [key, val] of this.cellMap) {
      if (key.toLowerCase().includes(lower) || lower.includes(key.toLowerCase())) return val;
    }

    return undefined;
  }

  // ==================== SIZE CALCULATIONS ====================

  private estimatePageWidth(arch: Architecture): number {
    if (arch.regions && arch.regions.length > 0) {
      let total = 100;
      for (const region of arch.regions) {
        total += this.calculateRegionWidth(region) + 80;
      }
      return Math.max(1500, total);
    }
    if (arch.subscription) {
      return Math.max(1500, this.calculateSubscriptionWidth(arch.subscription) + 200);
    }
    if (arch.subscriptions) {
      let total = 100;
      for (const sub of arch.subscriptions) {
        total += this.calculateSubscriptionWidth(sub) + 80;
      }
      return Math.max(1500, total);
    }
    return 1500;
  }

  private estimatePageHeight(arch: Architecture): number {
    let max = 800;
    if (arch.regions) {
      for (const region of arch.regions) {
        max = Math.max(max, this.calculateRegionHeight(region) + 200);
      }
    }
    if (arch.subscription) {
      max = Math.max(max, this.calculateSubscriptionHeight(arch.subscription) + 200);
    }
    if (arch.subscriptions) {
      for (const sub of arch.subscriptions) {
        max = Math.max(max, this.calculateSubscriptionHeight(sub) + 200);
      }
    }
    if (arch.onPremises && arch.onPremises.length > 0) {
      // On-prem is placed *below* all cloud content, so add its height
      const onPremHeight = Math.max(...arch.onPremises.map(op =>
        Math.max(200, (op.resources?.length || 0) * 90 + 80)
      ));
      max += onPremHeight + 100;
    }
    return max;
  }

  private calculateRegionWidth(region: Region): number {
    let max = 400;
    if (region.resourceGroups) {
      for (const rg of region.resourceGroups) {
        max = Math.max(max, this.calculateRGWidth(rg) + 60);
      }
    }
    return max;
  }

  private calculateRegionHeight(region: Region): number {
    let total = 80;
    if (region.resourceGroups) {
      for (const rg of region.resourceGroups) {
        total += this.calculateRGHeight(rg) + 40;
      }
    }
    return Math.max(400, total);
  }

  private calculateSubscriptionWidth(sub: Subscription): number {
    let total = 100;
    if (sub.regions && sub.regions.length > 0) {
      for (const region of sub.regions) {
        total += this.calculateRegionWidth(region) + 60;
      }
    } else if (sub.resourceGroups) {
      for (const rg of sub.resourceGroups) {
        total += this.calculateRGWidth(rg) + 40;
      }
    }
    return Math.max(400, total);
  }

  private calculateSubscriptionHeight(sub: Subscription): number {
    let max = 200;
    if (sub.regions && sub.regions.length > 0) {
      for (const region of sub.regions) {
        max = Math.max(max, this.calculateRegionHeight(region) + 100);
      }
    } else if (sub.resourceGroups) {
      for (const rg of sub.resourceGroups) {
        max = Math.max(max, this.calculateRGHeight(rg) + 100);
      }
    }
    return max;
  }

  private calculateRGWidth(rg: ResourceGroup): number {
    const vnets = rg.resources.filter(r => r.type === 'vnet' || r.type === 'hubVnet') as VNet[];
    const otherCount = rg.resources.filter(r => r.type !== 'vnet' && r.type !== 'hubVnet').length;
    
    let vnetWidth = 0;
    for (const vnet of vnets) {
      vnetWidth = Math.max(vnetWidth, this.calculateVNetWidth(vnet));
    }

    const otherWidth = Math.ceil(otherCount / 4) > 0 ? Math.min(otherCount, 4) * 130 + 40 : 0;
    return Math.max(300, vnetWidth + otherWidth + 80);
  }

  private calculateRGHeight(rg: ResourceGroup): number {
    const vnets = rg.resources.filter(r => r.type === 'vnet' || r.type === 'hubVnet') as VNet[];
    const otherCount = rg.resources.filter(r => r.type !== 'vnet' && r.type !== 'hubVnet').length;

    let vnetHeight = 0;
    for (const vnet of vnets) {
      vnetHeight += this.calculateVNetHeight(vnet) + 30;
    }

    const otherHeight = Math.ceil(otherCount / 4) * 110 + 50;
    return Math.max(200, Math.max(vnetHeight + 60, otherHeight + 40));
  }

  private calculateVNetWidth(vnet: VNet): number {
    const isHub = vnet.type === 'hubVnet';
    
    if (isHub && vnet.subnets) {
      // Hub VNETs: subnets arranged horizontally
      let total = 40;
      for (const subnet of vnet.subnets) {
        total += this.calculateSubnetWidth(subnet) + 20;
      }
      return Math.max(400, total);
    }
    
    // Spoke VNETs: subnets arranged vertically
    let max = 300;
    if (vnet.subnets) {
      for (const subnet of vnet.subnets) {
        max = Math.max(max, this.calculateSubnetWidth(subnet) + 40);
      }
    }
    return max;
  }

  private calculateVNetHeight(vnet: VNet): number {
    const isHub = vnet.type === 'hubVnet';
    
    if (isHub && vnet.subnets) {
      // Hub VNETs: find tallest subnet
      let max = 100;
      for (const subnet of vnet.subnets) {
        max = Math.max(max, this.calculateSubnetHeight(subnet));
      }
      return max + 70;
    }
    
    // Spoke VNETs: sum subnet heights
    let total = 60;
    if (vnet.subnets) {
      for (const subnet of vnet.subnets) {
        total += this.calculateSubnetHeight(subnet) + 20;
      }
    }
    return Math.max(150, total);
  }

  private calculateSubnetWidth(subnet: Subnet): number {
    const resourceCount = subnet.resources?.length || 0;
    const cols = Math.min(resourceCount, 2);
    return Math.max(150, cols * 130 + 30);
  }

  private calculateSubnetHeight(subnet: Subnet): number {
    const resourceCount = subnet.resources?.length || 0;
    const rows = Math.ceil(Math.max(1, resourceCount) / 2);
    return Math.max(100, rows * 110 + 50);
  }
}
