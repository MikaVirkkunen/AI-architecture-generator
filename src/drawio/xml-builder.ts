/**
 * Draw.io XML Builder
 * Generates valid .drawio XML files for Azure architecture diagrams
 * Supports multi-region, hub-spoke, and complex HA architectures
 */

import { create } from 'xmlbuilder2';
import { generateCellId, resetCounter } from '../utils/id-generator.js';
import { RESOURCES, CONTAINER_STYLES, type ResourceDefinition } from '../schema/resources.js';
import type { Architecture, Resource, Subscription, ResourceGroup, Region, VNet, Subnet, Connection, Position, OnPremises, DiagramPage } from '../schema/types.js';

interface CellInfo {
  id: string;
  parentId: string;
  position: Position;
}

interface ContainerBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DrawIOBuilder {
  private cellMap: Map<string, CellInfo> = new Map();
  private idCounter = 0;
  private usedResourceTypes: Set<string> = new Set();
  private usedConnectionStyles: Set<string> = new Set();
  /** Absolute bounds of every container (keyed by cell id) */
  private containerAbsBounds: Map<string, ContainerBounds> = new Map();

  constructor() {
    resetCounter();
  }

  /**
   * Generate a complete .drawio XML file from an architecture definition.
   * Supports multi-page diagrams via arch.pages.
   */
  public generate(arch: Architecture): string {
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('mxfile', {
        host: 'app.diagrams.net',
        modified: new Date().toISOString(),
        agent: 'az-arch-gen',
        version: '1.0.0',
        type: 'device',
      });

    if (arch.pages && arch.pages.length > 0) {
      // Multi-page mode
      for (const page of arch.pages) {
        const pageArch: Architecture = {
          title: page.name,
          description: page.description,
          regions: page.regions,
          subscription: page.subscription,
          connections: page.connections,
          globalResources: page.globalResources,
          onPremises: page.onPremises,
        };
        if (page.resourceGroups) {
          pageArch.subscription = {
            name: 'Azure Subscription',
            resourceGroups: page.resourceGroups,
          };
        }
        this.generatePage(doc, page.name, pageArch);
      }
    } else {
      // Single-page mode (existing behaviour)
      this.generatePage(doc, arch.title || 'Azure Architecture', arch);
    }

    return doc.end({ prettyPrint: true });
  }

  /**
   * Render one page (diagram tab) into the parent mxfile element.
   */
  private generatePage(doc: any, pageName: string, arch: Architecture): void {
    this.cellMap.clear();
    this.idCounter = 0;
    this.usedResourceTypes.clear();
    this.usedConnectionStyles.clear();
    this.containerAbsBounds.clear();

    const diagram = doc.ele('diagram', {
      id: generateCellId('diagram'),
      name: pageName,
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

    // Title block
    let titleOffset = 0;
    if (arch.title) {
      const titleId = this.nextId();
      // Estimate height needed for description text
      const descLen = arch.description?.length || 0;
      const descLines = descLen > 0 ? Math.ceil(descLen / 100) : 0; // ~100 chars per line at width 800
      const titleHeight = descLines > 0 ? Math.max(60, 30 + descLines * 18) : 30;
      const titleText = `<b style="font-size:16px">${arch.title}</b>${arch.description ? '<br><span style="font-size:12px;color:#666666">' + arch.description + '</span>' : ''}`;
      root.ele('mxCell', {
        id: titleId,
        value: titleText,
        style: 'text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;overflow=hidden;fontSize=14;fontColor=#333333;',
        vertex: '1',
        parent: '1',
      }).ele('mxGeometry', {
        x: '50', y: '10', width: '800', height: String(titleHeight),
        as: 'geometry',
      });
      titleOffset = titleHeight + 10;
    }

    let currentX = 50;
    let currentY = 50 + titleOffset;
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

    // Add legend
    if (this.usedResourceTypes.size > 0) {
      const legendX = Math.max(totalCloudWidth, this.estimatePageWidth(arch)) - 230;
      const legendY = 50 + titleOffset;
      this.buildLegend(root, legendX, legendY);
    }
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

    // Build AZ containers if present
    if (subnet.availabilityZones && subnet.availabilityZones.length > 0) {
      let azX = 15;
      const azY = 45;
      const azSpacing = 15;

      for (const azGroup of subnet.availabilityZones) {
        const azId = this.nextId();
        const azResourceCount = azGroup.resources.length;
        const azCols = Math.min(azResourceCount, 2);
        const azRows = Math.ceil(azResourceCount / 2);
        const azWidth = Math.max(150, azCols * 130 + 30);
        const azHeight = Math.max(110, azRows * 110 + 50);

        this.addContainer(parent, {
          id: azId,
          parentId: id,
          value: `Availability Zone ${azGroup.zone}`,
          style: CONTAINER_STYLES.availabilityZone,
          x: azX,
          y: azY,
          width: azWidth,
          height: azHeight,
        });

        this.cellMap.set(`AZ-${azGroup.zone}-${subnet.name}`, { id: azId, parentId: id, position: { x: azX, y: azY } });

        // Build resources inside AZ container
        let resX = 15;
        let resY = 40;
        let col = 0;
        const maxCols = Math.max(2, Math.floor((azWidth - 30) / 130));

        for (const resource of azGroup.resources) {
          this.buildResource(parent, resource, azId, { x: resX + col * 130, y: resY });
          col++;
          if (col >= maxCols) {
            col = 0;
            resY += 110;
          }
        }

        azX += azWidth + azSpacing;
      }
    }

    // Build non-AZ resources in subnet
    if (subnet.resources) {
      let resX = 15;
      let resY = subnet.availabilityZones && subnet.availabilityZones.length > 0
        ? this.calculateAZSectionHeight(subnet) + 55
        : 45;
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

  private calculateAZSectionHeight(subnet: Subnet): number {
    if (!subnet.availabilityZones || subnet.availabilityZones.length === 0) return 0;
    let maxHeight = 0;
    for (const azGroup of subnet.availabilityZones) {
      const rows = Math.ceil(azGroup.resources.length / 2);
      const azHeight = Math.max(110, rows * 110 + 50);
      maxHeight = Math.max(maxHeight, azHeight);
    }
    return maxHeight;
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

    this.usedResourceTypes.add(resource.type);

    const id = resource.id || this.nextId();

    // Build property label (small text below name)
    const displayProps = this.getDisplayProperties(resource);
    const propLabel = displayProps.length > 0
      ? '<br><font style="font-size:9px;color:#666666">' + displayProps.join(' | ') + '</font>'
      : '';

    // Resource with object wrapper for properties
    const obj = parent.ele('object', {
      label: resource.name + propLabel,
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

  /** Pick which resource properties to display as labels */
  private getDisplayProperties(resource: Resource): string[] {
    if (!resource.properties) return [];
    const labels: string[] = [];
    const displayKeys: Record<string, string> = {
      sku: 'SKU',
      tier: 'Tier',
      size: 'Size',
      vmSize: 'Size',
      addressSpace: 'CIDR',
      addressPrefix: 'CIDR',
      bandwidth: 'BW',
      capacity: 'Cap',
      replicaCount: 'Replicas',
      nodeCount: 'Nodes',
      version: 'v',
      kind: 'Kind',
    };
    for (const [key, label] of Object.entries(displayKeys)) {
      if (resource.properties[key] !== undefined && resource.properties[key] !== null) {
        labels.push(`${label}: ${resource.properties[key]}`);
      }
    }
    return labels.slice(0, 3); // Max 3 properties shown
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

  /**
   * Get the absolute centre of a cell (container or resource).
   */
  private getAbsoluteCenter(cell: CellInfo): Position {
    const parentBounds = this.containerAbsBounds.get(cell.parentId);
    const absX = cell.position.x + (parentBounds?.x ?? 0);
    const absY = cell.position.y + (parentBounds?.y ?? 0);
    const own = this.containerAbsBounds.get(cell.id);
    if (own) {
      return { x: absX + own.width / 2, y: absY + own.height / 2 };
    }
    return { x: absX + 32, y: absY + 32 }; // default icon centre
  }

  /**
   * Get the absolute right edge X of a cell (container or resource icon).
   */
  private getAbsoluteRightEdge(cell: CellInfo): number {
    const parentBounds = this.containerAbsBounds.get(cell.parentId);
    const absX = cell.position.x + (parentBounds?.x ?? 0);
    const own = this.containerAbsBounds.get(cell.id);
    return absX + (own?.width ?? 64);
  }

  /**
   * Collect the IDs of a cell and all its ancestor containers.
   */
  private getAncestorIds(cell: CellInfo): Set<string> {
    const ids = new Set<string>();
    ids.add(cell.id);
    let pid = cell.parentId;
    while (pid && pid !== '0') {
      ids.add(pid);
      // Walk upward — find any cellMap entry whose id matches pid
      let found = false;
      for (const c of this.cellMap.values()) {
        if (c.id === pid) {
          pid = c.parentId;
          found = true;
          break;
        }
      }
      if (!found) break;
    }
    return ids;
  }

  /**
   * Check if inner bounds are geometrically contained within outer bounds.
   */
  private isInsideBounds(inner: ContainerBounds, outer: ContainerBounds): boolean {
    return inner.x >= outer.x && inner.y >= outer.y &&
      inner.x + inner.width <= outer.x + outer.width &&
      inner.y + inner.height <= outer.y + outer.height;
  }

  /**
   * Detect containers that lie vertically between `from` and `to` and would
   * obstruct a straight edge.  Skips the source, target, any container
   * that is an ancestor of either, and any container that is geometrically
   * inside the source or target (descendants / children).
   */
  private findObstructingContainers(
    from: CellInfo,
    to: CellInfo,
  ): ContainerBounds[] {
    const fromCenter = this.getAbsoluteCenter(from);
    const toCenter = this.getAbsoluteCenter(to);

    const topY = Math.min(fromCenter.y, toCenter.y);
    const botY = Math.max(fromCenter.y, toCenter.y);

    // If vertical distance is very small there's nothing to obstruct
    if (botY - topY < 100) return [];

    const skipIds = new Set([...this.getAncestorIds(from), ...this.getAncestorIds(to)]);

    // Get bounds of source and target so we can skip their children
    const srcBounds = this.containerAbsBounds.get(from.id);
    const tgtBounds = this.containerAbsBounds.get(to.id);

    const obstructions: ContainerBounds[] = [];
    for (const [id, bounds] of this.containerAbsBounds) {
      if (skipIds.has(id)) continue;
      // Skip containers that are geometrically inside source or target
      if (srcBounds && this.isInsideBounds(bounds, srcBounds)) continue;
      if (tgtBounds && this.isInsideBounds(bounds, tgtBounds)) continue;
      // Container must be vertically *between* source and target
      const cTop = bounds.y;
      const cBot = bounds.y + bounds.height;
      const cMid = (cTop + cBot) / 2;
      if (cMid <= topY || cMid >= botY) continue;
      // Container must horizontally overlap with the source–target band
      const leftX = Math.min(fromCenter.x, toCenter.x) - 50;
      const rightX = Math.max(fromCenter.x, toCenter.x) + 50;
      const cLeft = bounds.x;
      const cRight = bounds.x + bounds.width;
      if (cRight < leftX || cLeft > rightX) continue;
      obstructions.push(bounds);
    }
    return obstructions;
  }

  private buildConnections(parent: any, connections: Connection[]): void {
    for (const conn of connections) {
      const from = this.findCell(conn.from);
      const to = this.findCell(conn.to);

      if (!from || !to) {
        console.warn(`Cannot create connection: ${conn.from} -> ${conn.to} (resource not found)`);
        continue;
      }

      if (conn.style) {
        this.usedConnectionStyles.add(conn.style);
      }

      let style = 'edgeStyle=orthogonalEdgeStyle;rounded=1;orthogonalLoop=1;jettySize=auto;html=1;endArrow=classic;endFill=1;fontSize=10;labelBackgroundColor=#FFFFFF;';
      
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

      // Check if containers lie between source and target
      const obstructions = this.findObstructingContainers(from, to);

      const edgeCell = parent.ele('mxCell', {
        id: this.nextId(),
        value: conn.label || '',
        style: obstructions.length > 0
          ? style + 'exitX=1;exitY=0.5;exitDx=0;exitDy=0;entryX=1;entryY=0.5;entryDx=0;entryDy=0;'
          : style,
        edge: '1',
        parent: '1',
        source: from.id,
        target: to.id,
      });

      if (obstructions.length > 0) {
        // Route around the right side of all obstructions
        const fromRight = this.getAbsoluteRightEdge(from);
        const toRight = this.getAbsoluteRightEdge(to);
        const obstRight = Math.max(...obstructions.map(b => b.x + b.width));
        const waypointX = Math.max(fromRight, toRight, obstRight) + 40;

        const fromCenter = this.getAbsoluteCenter(from);
        const toCenter = this.getAbsoluteCenter(to);

        const geo = edgeCell.ele('mxGeometry', {
          relative: '1',
          as: 'geometry',
        });
        const pts = geo.ele('Array', { as: 'points' });
        pts.ele('mxPoint', { x: String(waypointX), y: String(fromCenter.y) });
        pts.ele('mxPoint', { x: String(waypointX), y: String(toCenter.y) });
      } else {
        edgeCell.ele('mxGeometry', {
          relative: '1',
          as: 'geometry',
        });
      }
    }
  }

  // ==================== LEGEND ====================

  private buildLegend(parent: any, x: number, y: number): void {
    const legendItems = Array.from(this.usedResourceTypes)
      .map(type => ({ type, def: RESOURCES[type] }))
      .filter(item => item.def)
      .sort((a, b) => a.def.displayName.localeCompare(b.def.displayName));

    if (legendItems.length === 0) return;

    const itemHeight = 28;
    const legendWidth = 210;
    const headerHeight = 30;
    let totalHeight = headerHeight + legendItems.length * itemHeight + 10;

    // Add connection style entries
    const connStyles: Array<{ label: string; color: string; dashed: boolean }> = [];
    if (this.usedConnectionStyles.has('expressroute')) connStyles.push({ label: 'ExpressRoute', color: '#FF6600', dashed: false });
    if (this.usedConnectionStyles.has('vpn')) connStyles.push({ label: 'VPN', color: '#0066CC', dashed: true });
    if (this.usedConnectionStyles.has('peering')) connStyles.push({ label: 'VNet Peering', color: '#009900', dashed: false });
    if (this.usedConnectionStyles.has('dashed')) connStyles.push({ label: 'Dashed', color: '#666666', dashed: true });
    if (connStyles.length > 0) totalHeight += 20 + connStyles.length * itemHeight;

    const legendId = this.nextId();

    this.addContainer(parent, {
      id: legendId,
      parentId: '1',
      value: 'Legend',
      style: 'rounded=1;whiteSpace=wrap;html=1;fillColor=#F5F5F5;strokeColor=#999999;dashed=1;verticalAlign=top;fontStyle=1;fontSize=12;container=1;collapsible=0;',
      x, y,
      width: legendWidth,
      height: totalHeight,
    });

    let entryY = headerHeight;
    for (const item of legendItems) {
      // Small icon
      parent.ele('mxCell', {
        id: this.nextId(),
        value: '',
        style: `aspect=fixed;html=1;points=[];align=center;image;fontSize=10;image=${item.def.icon};`,
        vertex: '1',
        parent: legendId,
      }).ele('mxGeometry', {
        x: '8', y: String(entryY), width: '20', height: '20',
        as: 'geometry',
      });

      // Label
      parent.ele('mxCell', {
        id: this.nextId(),
        value: item.def.displayName,
        style: 'text;html=1;align=left;verticalAlign=middle;whiteSpace=nowrap;overflow=hidden;fontSize=10;fontColor=#333333;',
        vertex: '1',
        parent: legendId,
      }).ele('mxGeometry', {
        x: '34', y: String(entryY), width: '170', height: '20',
        as: 'geometry',
      });

      entryY += itemHeight;
    }

    // Connection styles section
    if (connStyles.length > 0) {
      entryY += 5;
      parent.ele('mxCell', {
        id: this.nextId(),
        value: '<b>Connections</b>',
        style: 'text;html=1;align=left;verticalAlign=middle;fontSize=10;fontColor=#333333;',
        vertex: '1',
        parent: legendId,
      }).ele('mxGeometry', {
        x: '8', y: String(entryY), width: '190', height: '15',
        as: 'geometry',
      });
      entryY += 18;

      for (const cs of connStyles) {
        parent.ele('mxCell', {
          id: this.nextId(),
          value: '',
          style: `endArrow=classic;html=1;strokeColor=${cs.color};strokeWidth=2;${cs.dashed ? 'dashed=1;' : ''}`,
          edge: '1',
          parent: legendId,
        }).ele('mxGeometry', {
          width: '40', height: '0', relative: '1',
          as: 'geometry',
        }).up()
          .ele('Array', { as: 'points' }).up()
          .ele('mxPoint', { x: '8', y: String(entryY + 10), as: 'sourcePoint' }).up()
          .ele('mxPoint', { x: '30', y: String(entryY + 10), as: 'targetPoint' });

        parent.ele('mxCell', {
          id: this.nextId(),
          value: cs.label,
          style: 'text;html=1;align=left;verticalAlign=middle;fontSize=10;fontColor=#333333;',
          vertex: '1',
          parent: legendId,
        }).ele('mxGeometry', {
          x: '34', y: String(entryY), width: '170', height: '20',
          as: 'geometry',
        });

        entryY += itemHeight;
      }
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

    // Track absolute bounds for edge-routing calculations
    const parentBounds = this.containerAbsBounds.get(opts.parentId);
    const absX = opts.x + (parentBounds?.x ?? 0);
    const absY = opts.y + (parentBounds?.y ?? 0);
    this.containerAbsBounds.set(opts.id, {
      x: absX, y: absY, width: opts.width, height: opts.height,
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
    const basicCols = Math.min(resourceCount, 2);
    let basicWidth = Math.max(150, basicCols * 130 + 30);

    // If there are AZ containers, calculate their total width
    if (subnet.availabilityZones && subnet.availabilityZones.length > 0) {
      let azTotalWidth = 15; // initial padding
      for (const azGroup of subnet.availabilityZones) {
        const azCols = Math.min(azGroup.resources.length, 2);
        azTotalWidth += Math.max(150, azCols * 130 + 30) + 15;
      }
      basicWidth = Math.max(basicWidth, azTotalWidth + 15);
    }

    return basicWidth;
  }

  private calculateSubnetHeight(subnet: Subnet): number {
    const resourceCount = subnet.resources?.length || 0;
    const rows = Math.ceil(Math.max(1, resourceCount) / 2);
    let height = Math.max(100, rows * 110 + 50);

    // Add space for AZ containers
    if (subnet.availabilityZones && subnet.availabilityZones.length > 0) {
      let maxAZHeight = 0;
      for (const azGroup of subnet.availabilityZones) {
        const azRows = Math.ceil(azGroup.resources.length / 2);
        maxAZHeight = Math.max(maxAZHeight, Math.max(110, azRows * 110 + 50));
      }
      // AZ section + non-AZ resources below
      const nonAZRows = Math.ceil(resourceCount / 2);
      const nonAZHeight = resourceCount > 0 ? nonAZRows * 110 + 20 : 0;
      height = maxAZHeight + nonAZHeight + 60;
    }

    return height;
  }
}
