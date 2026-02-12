# Testing Guide — New Features

This guide covers how to test all newly implemented features. Start both servers before testing:

```bash
# Terminal 1 — Backend
cd /home/mika/github/AI-architecture-generator
npx tsx src/server.ts

# Terminal 2 — Frontend
cd /home/mika/github/AI-architecture-generator/web
npx vite
```

Open http://localhost:5173 in your browser.

---

## Prerequisites

- Logged in with `az login`
- An Azure OpenAI resource with a chat-capable gpt-5 model deployment
- Both backend (port 3001) and frontend (port 5173) running

---

## Feature 1: Streaming Generation

**What it does:** The frontend tries SSE streaming (`/api/generate/stream`) first. You see real-time token count progress instead of a frozen "Generating..." button.

### Test Steps

1. Select your Azure OpenAI resource and deployment in the **Config** panel
2. Enter a prompt like: `3 VMs with a VNET and storage account`
3. Click **Generate Diagram**
4. **Expected:** The button text changes to show a spinner and status updates:
   - `Connecting...` → `Acquiring credentials...` → `Analysing your architecture...` → `AI is generating architecture...` → `Generating... (40 tokens)` → etc.
5. After completion, the diagram appears on the right

### Verifying Streaming Works

- Open browser DevTools → Network tab
- Look for a request to `/api/generate/stream` with status `200`
- Response type should be `text/event-stream`
- If streaming fails (404), it falls back to `/api/generate` silently — the button shows `Generating architecture...` without token counts

---

## Feature 2: Iterative Refinement

**What it does:** After generating a diagram, you can refine it by describing changes. The AI keeps the existing architecture and modifies it.

### Test Steps

1. Generate an initial diagram (e.g., `Hub and spoke network with firewall and 2 VMs in spoke`)
2. After the diagram appears, notice:
   - The panel header changes to **"Refine Architecture"**
   - The textarea label changes to **"Describe your changes"**
   - A **"New"** button appears next to the header
   - Previous prompts appear in a **conversation history** section
   - Example chips disappear
   - The title field disappears
3. Enter a refinement prompt: `Add a bastion host and a VPN gateway to the hub`
4. Click **Refine Diagram**
5. **Expected:** The new diagram should contain all original resources PLUS the bastion and VPN gateway
6. The conversation history now shows both prompts
7. Click **"New"** to start a completely fresh diagram (conversation resets)

### Keyboard Shortcut

- Press **Ctrl+Enter** (or **Cmd+Enter** on Mac) in the textarea to trigger generation

---

## Feature 3: PNG/SVG Export

**What it does:** Export the current diagram as PNG or SVG files.

### Test Steps

1. Generate any diagram
2. Wait for the diagram to fully load in the iframe (loading spinner disappears)
3. In the toolbar above the diagram, find the **"↓ PNG"** and **"↓ SVG"** buttons
4. Click **"↓ PNG"**:
   - The button text changes to **"⏳ PNG"** briefly
   - A PNG file downloads (filename matches the diagram title)
5. Click **"↓ SVG"**:
   - Same behavior, downloads an SVG file
6. **Expected:** Both files open correctly in an image viewer

### Edge Cases

- The export buttons are **disabled** while the diagram is still loading
- If Draw.io doesn't respond within 15 seconds, the export state auto-resets

---

## Feature 4: Diagram Legend & Title Block

**What it does:** Each diagram automatically includes a title block at the top and a legend at the bottom showing used resource types and connection styles.

### Test Steps

1. Generate a diagram with multiple resource types: `Hub-spoke with firewall, VPN gateway, 3 VMs, storage account, and Key Vault`
2. Open the diagram (or download as .drawio and open in Draw.io app)
3. **Title block** (top of diagram):
   - Shows the diagram title in bold (16px)
   - Shows description underneath (if the AI provided one)
4. **Legend** (bottom-right area):
   - Dashed border container labeled "Legend"
   - Lists each used resource type with its Azure icon and display name
   - Shows connection style indicators:
     - Orange solid = ExpressRoute
     - Blue dashed = VPN
     - Green solid = Peering
     - Gray dashed = Dashed connections
5. The legend only shows resource types actually used in the diagram (not all 127 types)

### Verification via XML

- Click the **"XML"** button in the toolbar
- Search for `"Legend"` — you should find an mxCell with that value
- Search for the title text — should appear near the top of the XML

---

## Feature 5: Resource Property Labels

**What it does:** Resources display their key properties (SKU, tier, VM size, etc.) as small labels below the resource icon.

### Test Steps

1. Generate a diagram with specific properties: `AKS cluster with 3 nodes, Standard_D4s_v3 VMs, and a SQL Database with Standard tier S3 SKU`
2. Open the diagram in Draw.io (download the .drawio file for best visibility)
3. **Expected:** Resources should show small property labels underneath, such as:
   - `SKU: Standard` on SQL Database
   - `Tier: S3` on SQL Database
   - `Size: Standard_D4s_v3` on AKS
   - `Node Count: 3` on AKS
4. Maximum 3 properties are shown per resource
5. Properties shown include: SKU, Tier, Size, VM Size, Address Space, Address Prefix, Bandwidth, Capacity, Replica Count, Node Count, Version, Kind

### Verification via XML

- Click **"XML"** and look for `style="font-size:9px"` — these are the property label cells
- They should contain text like `SKU: Standard`

---

## Feature 6: Prompt History

**What it does:** All generated diagrams are saved to browser localStorage. You can reload them later without regenerating.

### Test Steps

1. Generate 2-3 different diagrams with different prompts
2. Look for the **"History (N)"** section below the Generate panel in the sidebar
3. Click it to expand
4. **Expected:**
   - Each entry shows: relative timestamp (e.g., "just now", "2m ago"), a resource count badge, and the prompt text (truncated to 80 chars)
   - Each entry has a **"Load"** button and a **"✕"** delete button
5. Click **"Load"** on an older entry:
   - The diagram viewer switches to show that historical diagram
   - The XML and resource list update accordingly
6. Click **"✕"** on an entry:
   - The entry is removed from the list
7. Click **"Clear all history"** at the bottom:
   - A confirmation dialog appears
   - If confirmed, all history is cleared and the panel disappears

### Persistence

- Close and reopen the browser tab — history should persist
- History is stored in `localStorage` under key `az-arch-gen-history`
- Maximum 50 entries are kept (oldest are evicted)

---

## Feature 7: Multi-Page Diagrams

**What it does:** You can ask the AI to create a multi-page/multi-tab diagram where different aspects of the architecture are on separate Draw.io pages.

### Test Steps

1. Use a prompt that explicitly requests multiple pages:
   ```
   Create a multi-page diagram:
   Page 1: Network layer with hub-spoke VNETs, firewall, and VPN gateway
   Page 2: Application layer with AKS, App Service, and API Management
   Page 3: Data layer with SQL Database, CosmosDB, and Storage Account
   ```
2. **Expected:**
   - The generated .drawio file contains multiple `<diagram>` elements (one per page)
   - In the Draw.io viewer, you should see page tabs at the bottom
   - Each page has its own title block and legend
3. Download the .drawio file and open it in Draw.io desktop — verify multiple tabs work

### Note

- Multi-page only activates when the AI returns a `pages` array in its response
- Without explicitly asking, the AI generates single-page diagrams (rule 12 enables multi-page; rule 13 tells the AI not to use it unless asked)

---

## Feature 8: Updated AI Icons

**What it does:** AI/ML resource types now use dedicated Azure icons instead of the generic Cognitive Services icon.

### Test Steps

1. Generate a diagram with AI resources: `Architecture with Azure OpenAI, AI Search, Document Intelligence, and Speech Service`
2. Open the diagram in Draw.io
3. **Expected:** Each AI service should have its own distinct icon:
   - Azure OpenAI → Azure_OpenAI.svg
   - AI Search → Serverless_Search.svg  
   - Document Intelligence → Form_Recognizers.svg
   - Speech Service → Speech_Services.svg
4. They should NOT all look like the same generic brain icon

### Verification via XML

- Click **"XML"** and search for `Azure_OpenAI` — should find it in an icon style attribute

---

## Feature 9: Template Removal

**What it does:** The old JSON template system has been removed. All diagram generation now goes through the AI.

### Test Steps

1. Verify no template-related UI elements exist in the sidebar
2. The `templates/` directory should not exist in the project
3. The API should not have any template-related endpoints

---

## Quick Smoke Test Checklist

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | Generate a simple diagram | Diagram appears with title + legend | |
| 2 | Check streaming progress | Button shows token count during generation | |
| 3 | Refine the diagram | Header changes, conversation history shows, result merges | |
| 4 | Press Ctrl+Enter in textarea | Triggers generation | |
| 5 | Click "New" in refine mode | Resets to fresh generation | |
| 6 | Export PNG | PNG file downloads | |
| 7 | Export SVG | SVG file downloads | |
| 8 | Check legend in diagram | Legend shows used types + connection styles | |
| 9 | Check property labels | Resources show sku/tier/size labels | |
| 10 | Expand History panel | Shows previous generations | |
| 11 | Load from history | Previous diagram restores | |
| 12 | Delete history entry | Entry removed | |
| 13 | Clear all history | All entries removed after confirmation | |
| 14 | Close/reopen tab | History persists from localStorage | |
| 15 | Request multi-page diagram | Multiple Draw.io tabs generated | |
| 16 | Check AI service icons | Different icons for OpenAI, Search, etc. | |
| 17 | Toggle dark/light theme | All new components render correctly in both themes | |

---

## Troubleshooting

- **"Connecting..." stays forever:** Check that the backend server is running on port 3001
- **No streaming (just "Generating architecture..."):** The streaming endpoint may have failed and fallen back to the standard endpoint. Check browser DevTools Network tab for errors
- **Export buttons disabled:** Wait for the diagram iframe to fully load (spinner disappears)
- **No history panel visible:** Generate at least one diagram first — the panel only appears when history exists
- **Multi-page not working:** The AI may not return pages unless you explicitly ask. Use the word "multi-page" in your prompt
