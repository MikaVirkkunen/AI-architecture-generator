# AI Azure Architecture Generator

## Vision
Transform natural language descriptions like:
> "Draw me 3 VMs with a VNET and some storage account and CosmosDB backend"

Into proper Draw.io Azure architecture diagrams with correct containment relationships (VMs inside subnets inside VNETs inside subscriptions).

## How ARI Does It (Reverse Engineering Summary)

### Core Mechanics
1. **XML Generation**: ARI creates Draw.io `.drawio` files which are XML-based
2. **mxCell Elements**: Each resource is an `<mxCell>` with:
   - `id`: Unique identifier
   - `style`: References Azure icon stencils (e.g., `img/lib/azure2/compute/Virtual_Machine.svg`)
   - `vertex`: "1" for shapes
   - `parent`: ID of containing element (for nesting)
   - `mxGeometry`: x, y, width, height positioning

3. **Containers (Swimlanes)**: VNETs, Subscriptions use `swimlane` style for nested containment
4. **Connections**: Lines between resources use `edge` attribute with `source` and `target` IDs

### Key Files in ARI
- `Build-ARIDiagramSubnet.ps1` (93KB) - Subnet component building, icon definitions
- `Start-ARIDiagramNetwork.ps1` (85KB) - Network topology with containers
- `Start-ARIDiagramSubscription.ps1` (126KB) - Subscription-level diagrams
- `Start-ARIDiagramOrganization.ps1` (53KB) - Hierarchy diagrams
- `Set-ARIDiagramFile.ps1` - Merges XML files

### Azure Icon Stencils (from ARI)
```javascript
// These reference Draw.io's built-in Azure icon library
IconVMs = "image=img/lib/azure2/compute/Virtual_Machine.svg"
IconVNET = "image=img/lib/azure2/networking/Virtual_Networks.svg"
IconSubscription = "image=img/lib/azure2/general/Subscriptions.svg"
IconRG = "image=img/lib/mscae/ResourceGroup.svg"
IconStorage = "image=img/lib/azure2/storage/Storage_Accounts.svg"
IconCosmosDB = "image=img/lib/azure2/databases/Azure_Cosmos_DB.svg"
// ... many more
```

## Architecture

### Data Flow
```
User Prompt → AI (parse & structure) → JSON Schema → DrawIO XML Generator → .drawio file
```

### Components

#### 1. AI Parser (LLM Integration)
- Input: Natural language description
- Output: Structured JSON describing resources and relationships
- Placeholder for: Azure OpenAI / Claude / OpenAI

#### 2. Schema Definition
```json
{
  "subscription": {
    "name": "My Subscription",
    "resourceGroups": [{
      "name": "rg-production",
      "resources": [
        {
          "type": "microsoft.network/virtualnetworks",
          "name": "vnet-main",
          "properties": {
            "addressSpace": "10.0.0.0/16",
            "subnets": [
              { "name": "subnet-web", "addressPrefix": "10.0.1.0/24" }
            ]
          }
        },
        {
          "type": "microsoft.compute/virtualmachines",
          "name": "vm-web-01",
          "properties": { "size": "Standard_D2s_v3" },
          "containedIn": "subnet-web"
        }
      ]
    }]
  }
}
```

#### 3. DrawIO XML Generator (Core Engine)
- Takes structured JSON
- Generates proper Draw.io XML with:
  - Correct parent-child relationships
  - Auto-layout positioning
  - Azure icon stencils
  - Connection lines

#### 4. Resource Library
- Azure resource type definitions
- Icon mappings
- Default sizing
- Containment rules (what can be inside what)

## Implementation Plan

### Phase 1: Core XML Generation (No AI)
1. Create TypeScript/Node.js project
2. Implement Draw.io XML builder
3. Define Azure resource types & icons
4. Implement containment logic (VM → Subnet → VNET → RG → Subscription)
5. Basic auto-layout algorithm
6. Test with hardcoded sample data

### Phase 2: AI Integration
1. Create prompt template for parsing architecture descriptions
2. Integrate with AI (Claude/OpenAI/Azure OpenAI)
3. Parse response into structured JSON
4. Validate against schema
5. Generate diagram

### Phase 3: Polish & Features
1. Web UI or CLI interface
2. Support more resource types
3. Connection inference (e.g., App → Database)
4. Export options (PNG, SVG via headless browser)
5. Templates for common architectures

## File Structure
```
AI-architecture-generator/
├── PLAN.md                 # This file
├── README.md               # Usage documentation
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts            # Main entry point
│   ├── ai/
│   │   ├── parser.ts       # AI prompt & response parsing
│   │   ├── prompts.ts      # System prompts for architecture parsing
│   │   └── providers/
│   │       ├── claude.ts
│   │       ├── openai.ts
│   │       └── azure-openai.ts
│   ├── drawio/
│   │   ├── xml-builder.ts  # Core XML generation
│   │   ├── layout.ts       # Auto-positioning algorithm
│   │   └── stencils.ts     # Azure icon definitions
│   ├── schema/
│   │   ├── types.ts        # TypeScript types
│   │   └── resources.ts    # Azure resource definitions
│   └── utils/
│       └── id-generator.ts
├── templates/              # Example architecture templates
│   ├── web-app-basic.json
│   ├── three-tier.json
│   └── hub-spoke.json
└── output/                 # Generated .drawio files
```

## Containment Rules (Azure Hierarchy)

```
Azure Cloud
└── Subscription
    └── Resource Group
        ├── Virtual Network
        │   └── Subnet
        │       ├── Virtual Machine (via NIC)
        │       ├── AKS Node Pool
        │       ├── App Service (VNet integrated)
        │       ├── Private Endpoint
        │       └── Load Balancer (internal)
        ├── Storage Account
        ├── Cosmos DB
        ├── SQL Database
        └── (other PaaS resources)
```

## Quick Start (After Implementation)

```bash
# CLI usage
npx az-arch-gen "3 VMs in a VNET with Storage and CosmosDB"

# Or with API
import { generateArchitecture } from 'az-arch-gen';
const diagram = await generateArchitecture({
  prompt: "3 VMs in a VNET with Storage and CosmosDB",
  provider: 'claude',  // or 'azure-openai', 'openai'
  outputPath: './my-architecture.drawio'
});
```

## Notes

- Draw.io uses `img/lib/azure2/` path for Azure icons - these are built into Draw.io
- No need to embed SVGs - just reference the paths
- The `parent` attribute in mxCell is key for containment
- `swimlane` style creates the grouped containers
