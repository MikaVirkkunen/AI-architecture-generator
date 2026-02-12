# AI Azure Architecture Generator

Generate Draw.io Azure architecture diagrams from natural language descriptions.

> "Draw me 3 VMs with a VNET and storage account and CosmosDB backend"

→ Outputs a proper `.drawio` file with VMs inside subnets inside VNETs, with all the correct Azure icons.

## Features

- 🗣️ **Natural language input** - Describe your architecture in plain English
- 🎨 **Official Azure icons** - Uses Draw.io's built-in Azure stencil library
- 📦 **Correct containment** - VMs go in subnets, subnets in VNETs, etc.
- 🔗 **Connections** - Automatically creates relationships between resources
- 🤖 **Multiple AI providers** - Claude, OpenAI, Azure OpenAI, or simple pattern matching
- 📝 **Template support** - Use JSON templates for common architectures

## Quick Start

```bash
# Install dependencies
npm install

# Run with simple parser (no AI needed)
npm run cli "3 VMs with VNET and storage account and CosmosDB"

# Or run the test suite
npm test
```

## Usage

### CLI

```bash
# Simple mode (pattern matching, no AI)
npx tsx src/cli.ts "3 VMs with VNET and storage account and CosmosDB" -o my-arch.drawio

# With Claude AI
ANTHROPIC_API_KEY=sk-ant-xxx npx tsx src/cli.ts "Web tier with load balancer and 3 VMs" -p claude

# With Azure OpenAI
AZURE_OPENAI_ENDPOINT=https://myresource.openai.azure.com \
AZURE_OPENAI_API_KEY=xxx \
AZURE_OPENAI_DEPLOYMENT=gpt-4o \
npx tsx src/cli.ts "Hub-spoke network with firewall" -p azure-openai
```

### Programmatic API

```typescript
import { generate, generateFromArchitecture } from 'az-arch-gen';

// From natural language
const result = await generate({
  prompt: '3 VMs with VNET and storage and CosmosDB',
  provider: 'simple', // or 'claude', 'openai', 'azure-openai'
  title: 'My Architecture',
});

console.log(result.xml); // Draw.io XML
console.log(result.architecture); // Structured architecture object

// From architecture object
import type { Architecture } from 'az-arch-gen';

const arch: Architecture = {
  title: 'My Architecture',
  subscription: {
    name: 'Production',
    resourceGroups: [{
      name: 'rg-prod',
      resources: [
        {
          type: 'vnet',
          name: 'vnet-main',
          subnets: [{
            type: 'subnet',
            name: 'subnet-web',
            resources: [
              { type: 'vm', name: 'vm-web-01' },
              { type: 'vm', name: 'vm-web-02' },
            ],
          }],
        },
        { type: 'storageAccount', name: 'stdata01' },
      ],
    }],
  },
};

const xml = generateFromArchitecture(arch);
```

## Supported Resources

| Category | Types |
|----------|-------|
| **Compute** | vm, vmss, aks, containerInstance, functionApp, appService |
| **Networking** | vnet, subnet, nsg, loadBalancer, appGateway, firewall, publicIp, privateEndpoint, vpnGateway, bastion |
| **Storage** | storageAccount |
| **Databases** | cosmosDb, sqlServer, sqlDatabase, redis |
| **Security** | keyVault |
| **Integration** | apiManagement, serviceBus, eventHub |
| **AI** | openAI |
| **Analytics** | databricks |

## How It Works

1. **Parse** - Natural language is parsed into structured resources (via AI or pattern matching)
2. **Organize** - Resources are organized into hierarchy (Subscription → RG → VNET → Subnet → Resources)
3. **Layout** - Positions are calculated with proper nesting
4. **Generate** - Draw.io XML is created with Azure icons

### Containment Rules

```
Subscription
└── Resource Group
    ├── Virtual Network
    │   └── Subnet
    │       ├── VM
    │       ├── AKS
    │       ├── Load Balancer
    │       ├── App Gateway
    │       ├── Firewall
    │       └── Private Endpoint
    ├── Storage Account (RG level)
    ├── Cosmos DB (RG level)
    ├── Key Vault (RG level)
    └── SQL Server (RG level)
```

## AI Provider Configuration

### Claude (Anthropic)

```bash
export ANTHROPIC_API_KEY=sk-ant-xxx
```

### OpenAI

```bash
export OPENAI_API_KEY=sk-xxx
```

### Azure OpenAI

```bash
export AZURE_OPENAI_ENDPOINT=https://myresource.openai.azure.com
export AZURE_OPENAI_API_KEY=xxx
export AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

## Templates

Pre-built architecture templates are in `templates/`:

- `three-tier.json` - Classic three-tier web application
- `hub-spoke.json` - Enterprise hub-spoke network topology

```bash
# Use a template
cat templates/three-tier.json | npx tsx -e "
  import { generateFromArchitecture } from './src/index.js';
  import { writeFileSync } from 'fs';
  const arch = JSON.parse(require('fs').readFileSync(0, 'utf-8'));
  writeFileSync('three-tier.drawio', generateFromArchitecture(arch));
"
```

## Viewing Diagrams

Open `.drawio` files with:
- [Draw.io Desktop](https://github.com/jgraph/drawio-desktop/releases)
- [Draw.io Web](https://app.diagrams.net/)
- [VS Code Draw.io Extension](https://marketplace.visualstudio.com/items?itemName=hediet.vscode-drawio)

## Based On

This project reverse-engineers the diagram generation from [Azure Resource Inventory (ARI)](https://github.com/microsoft/ARI), which creates Draw.io diagrams from real Azure subscriptions. This project does the inverse: creates diagrams from descriptions without needing an Azure subscription.

## License

MIT
