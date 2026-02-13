/**
 * Express API Server for Azure Architecture Generator
 *
 * Uses Azure CLI credentials — no app registration required.
 * User just runs `az login` before starting the server.
 */

import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { generate } from './index.js';
import { SYSTEM_PROMPT, parseAIResponse } from './ai/parser.js';
import { DrawIOBuilder } from './drawio/xml-builder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Returns true if the given endpoint URL belongs to a trusted Azure AI host.
 * This avoids substring checks that can be bypassed with crafted URLs.
 */
function isTrustedAzureAIEndpoint(endpoint: string): boolean {
  if (!endpoint) return false;
  try {
    const url = new URL(endpoint);
    const host = url.hostname.toLowerCase();
    return (
      host === 'openai.azure.com' ||
      host === 'cognitiveservices.azure.com' ||
      host.endsWith('.openai.azure.com') ||
      host.endsWith('.cognitiveservices.azure.com')
    );
  } catch {
    // Malformed URL: treat as untrusted
    return false;
  }
}

// Basic validation for Azure OpenAI deployment names to prevent SSRF via path injection.
// Allows only alphanumeric characters, hyphens, and underscores, with a reasonable length limit.
function isValidDeploymentName(name: unknown): name is string {
  if (typeof name !== 'string') {
    return false;
  }
  // Disallow path separators and query/fragment characters implicitly by allow-listing safe chars.
  const DEPLOYMENT_NAME_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
  return DEPLOYMENT_NAME_REGEX.test(name);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from built web app (production)
const webDistPath = resolve(__dirname, '../web/dist');
app.use(express.static(webDistPath));

// ==================== Azure CLI helpers ====================

/** Input validation: only allow safe characters in Azure resource IDs, names, etc. */
const SAFE_AZURE_ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const SAFE_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function validateAzureId(value: string, label: string): string | null {
  if (!value || !SAFE_AZURE_ID.test(value)) {
    return `Invalid ${label}`;
  }
  return null;
}

function validateUUID(value: string, label: string): string | null {
  if (!value || !SAFE_UUID.test(value)) {
    return `Invalid ${label} format`;
  }
  return null;
}

function isValidAzureEndpoint(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.openai.azure.com') ||
        parsed.hostname.endsWith('.cognitiveservices.azure.com'))
    );
  } catch {
    return false;
  }
}

/**
 * Run an Azure CLI command safely using execFileSync.
 * Arguments are passed as an array to prevent shell injection.
 * On Windows, `az` is a .cmd batch file that requires a shell to execute,
 * so we enable shell: true there. Input validation (UUID/ID regex) is the
 * primary security layer — all user-controlled values are validated before
 * reaching this function.
 * @param args - Array of arguments to pass to `az` (excluding `-o json`)
 */
const IS_WINDOWS = process.platform === 'win32';

function azCli(args: string[]): any {
  try {
    const output = execFileSync('az', [...args, '-o', 'json'], {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: IS_WINDOWS,
    });
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function getAccessToken(resource: string): string | null {
  try {
    const result = azCli(['account', 'get-access-token', '--resource', resource]);
    return result?.accessToken || null;
  } catch {
    return null;
  }
}

// ==================== Auth routes ====================

/**
 * GET /api/auth/status
 * Check if user is logged in via Azure CLI
 */
app.get('/api/auth/status', (_req, res) => {
  const account = azCli(['account', 'show']);
  if (account) {
    res.json({
      authenticated: true,
      user: {
        name: account.user?.name || 'Unknown',
        type: account.user?.type || 'user',
        tenantId: account.tenantId,
        subscriptionName: account.name,
        subscriptionId: account.id,
      },
    });
  } else {
    res.json({
      authenticated: false,
      message: 'Run "az login" in your terminal to authenticate.',
    });
  }
});

/**
 * GET /api/tenants
 * List available tenants with friendly display names
 */
app.get('/api/tenants', (_req, res) => {
  // az account tenant list doesn't return friendly names,
  // so we cross-reference with az account list which has tenantDisplayName
  const tenants = azCli(['account', 'tenant', 'list']);
  if (!tenants) {
    return res.status(401).json({ error: 'Not authenticated. Run "az login" first.' });
  }

  // Build a tenant name map from subscriptions (which have tenantDisplayName)
  const subs = azCli(['account', 'list']) || [];
  const nameMap = new Map<string, string>();
  for (const s of subs) {
    if (s.tenantId && s.tenantDisplayName && !nameMap.has(s.tenantId)) {
      nameMap.set(s.tenantId, s.tenantDisplayName);
    }
  }

  res.json(
    tenants.map((t: any) => ({
      tenantId: t.tenantId,
      displayName: nameMap.get(t.tenantId) || t.displayName || t.tenantId,
    }))
  );
});

/**
 * POST /api/tenants/:tenantId/select
 * Switch active tenant
 */
app.post('/api/tenants/:tenantId/select', (req, res) => {
  const { tenantId } = req.params;
  const err = validateUUID(tenantId, 'tenantId');
  if (err) return res.status(400).json({ error: err });

  try {
    execFileSync('az', ['login', '--tenant', tenantId, '--allow-no-subscriptions', '-o', 'none'], {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: IS_WINDOWS,
    });
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to switch tenant: ${error.message}` });
  }
});

/**
 * GET /api/subscriptions
 * List available subscriptions
 */
app.get('/api/subscriptions', (_req, res) => {
  const subs = azCli(['account', 'subscription', 'list']);
  if (!subs) {
    return res.status(401).json({ error: 'Not authenticated. Run "az login" first.' });
  }
  res.json(
    subs.map((s: any) => ({
      subscriptionId: s.subscriptionId,
      displayName: s.displayName,
      state: s.state,
      tenantId: s.tenantId,
    }))
  );
});

// ==================== Model filtering ====================

/**
 * Check if a model name is a chat-completion capable model suitable for
 * architecture generation (i.e. a reasoning / instruction-following LLM).
 * Excludes: embedding, image-generation, TTS, speech, video, and legacy models.
 */
function isChatModel(modelName: string): boolean {
  if (!modelName) return false;
  const m = modelName.toLowerCase();

  // Only allow gpt-5 family models – they have a consistent API surface
  // and are the most capable for architecture generation.
  return m.startsWith('gpt-5');  // gpt-5, gpt-5-nano, gpt-5-mini, etc.
}

/** Parse deployments from a resource and return only chat-capable ones */
function getChatDeployments(subId: string, name: string, rg: string) {
  const deployments = azCli([
    'cognitiveservices', 'account', 'deployment', 'list',
    '--subscription', subId, '--name', name, '--resource-group', rg,
  ]);
  if (!deployments) return [];
  return deployments
    .filter((d: any) => isChatModel(d.properties?.model?.name || ''))
    .map((d: any) => ({
      name: d.name,
      model: d.properties?.model?.name || 'unknown',
      modelVersion: d.properties?.model?.version || '',
      scaleType: d.sku?.name || d.properties?.scaleSettings?.scaleType || 'Standard',
    }));
}

// ==================== Resource & deployment routes ====================

/**
 * GET /api/subscriptions/:subId/openai-resources
 * List Azure OpenAI and AI Services resources that have at least one
 * chat-capable model deployment (gpt-4o, gpt-4.1, gpt-5, o-series, etc.).
 * Resources with only embedding / image / audio / video models are hidden.
 */
app.get('/api/subscriptions/:subId/openai-resources', (req, res) => {
  const { subId } = req.params;
  const err = validateUUID(subId, 'subscriptionId');
  if (err) return res.status(400).json({ error: err });

  // Fetch ALL Cognitive Services accounts and filter client-side for reliability
  const allResources = azCli([
    'cognitiveservices', 'account', 'list', '--subscription', subId,
  ]);
  if (!allResources) {
    return res.status(500).json({ error: 'Failed to list Cognitive Services resources. Check your subscription access.' });
  }

  // Include OpenAI (standalone), AIServices (Foundry/multi-service), and CognitiveServices with OpenAI endpoints
  const openAIKinds = new Set(['OpenAI', 'AIServices']);
  const candidates = allResources.filter((r: any) => {
    if (openAIKinds.has(r.kind)) return true;
    const ep = r.properties?.endpoint || '';
    return isTrustedAzureAIEndpoint(ep);
  });

  // Only return resources that have at least one chat-capable deployment
  const results = candidates
    .map((r: any) => {
      const rg = r.id?.split('/resourceGroups/')?.[1]?.split('/')[0] || '';
      const chatDeploys = getChatDeployments(subId, r.name, rg);
      return {
        id: r.id,
        name: r.name,
        kind: r.kind,
        location: r.location,
        endpoint: r.properties?.endpoint || `https://${r.name}.openai.azure.com`,
        resourceGroup: rg,
        chatModelCount: chatDeploys.length,
      };
    })
    .filter((r: any) => r.chatModelCount > 0);

  res.json(results);
});

/**
 * GET /api/subscriptions/:subId/openai-resources/:name/deployments
 * List only chat-capable model deployments for an Azure OpenAI / AI Services resource.
 */
app.get('/api/subscriptions/:subId/openai-resources/:name/deployments', (req, res) => {
  const { subId, name } = req.params;
  const rg = (req.query.rg as string) || '';

  const subErr = validateUUID(subId, 'subscriptionId');
  if (subErr) return res.status(400).json({ error: subErr });
  const nameErr = validateAzureId(name, 'resource name');
  if (nameErr) return res.status(400).json({ error: nameErr });
  if (rg) {
    const rgErr = validateAzureId(rg, 'resource group');
    if (rgErr) return res.status(400).json({ error: rgErr });
  }

  const chatDeploys = getChatDeployments(subId, name, rg);
  if (chatDeploys.length === 0) {
    return res.json([]);
  }
  res.json(chatDeploys);
});

// ==================== Generation routes ====================

const REFINEMENT_PROMPT = `You are refining an existing Azure architecture. The previous architecture JSON is provided below. The user wants to make changes to it.

IMPORTANT RULES FOR REFINEMENT:
- Keep ALL existing resources unless the user explicitly asks to remove them
- Add new resources as requested
- Modify properties of existing resources if asked
- Output a COMPLETE merged JSON (not just the diff)
- Use the same JSON format as a fresh generation
- Maintain all existing connections unless changes are needed

Previous architecture:
`;

/**
 * POST /api/generate/stream
 * Generate a Draw.io diagram with SSE streaming progress.
 */
app.post('/api/generate/stream', async (req, res) => {
  try {
    const { prompt, title, endpoint, deploymentName, previousArchitecture } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    if (!endpoint || !deploymentName) {
      return res.status(400).json({ error: 'Azure OpenAI endpoint and deploymentName are required.' });
    }
    if (!isValidAzureEndpoint(endpoint)) {
      return res.status(400).json({ error: 'Invalid Azure OpenAI endpoint. Must be an https://*.openai.azure.com or *.cognitiveservices.azure.com URL.' });
    }
    // Validate deploymentName to prevent path manipulation and enforce a safe character set
    if (typeof deploymentName !== 'string' || !/^[A-Za-z0-9._-]+$/.test(deploymentName)) {
      return res.status(400).json({ error: 'Invalid deploymentName. Use only letters, numbers, ".", "-", and "_".' });
    }

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    const sendEvent = (type: string, data: any) => {
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    sendEvent('status', { message: 'Acquiring credentials...' });

    const token = getAccessToken('https://cognitiveservices.azure.com');
    if (!token) {
      sendEvent('error', { error: 'Could not acquire Cognitive Services token. Run "az login" first.' });
      res.end();
      return;
    }

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    if (previousArchitecture) {
      // Iterative refinement mode
      sendEvent('status', { message: 'Refining architecture...' });
      messages.push({
        role: 'user',
        content: REFINEMENT_PROMPT + JSON.stringify(previousArchitecture, null, 2) + '\n\nUser changes: ' + prompt,
      });
    } else {
      sendEvent('status', { message: 'Analysing your architecture...' });
      messages.push({ role: 'user', content: prompt });
    }

    const aoaiUrl = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`;

    console.log(`  [AI/Stream] Generating with Azure OpenAI: ${deploymentName}`);

    const aiResponse = await fetch(aoaiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        max_completion_tokens: 50000,
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('  [AI/Stream] Azure OpenAI error:', aiResponse.status, errorText);

      if (aiResponse.status === 401 || aiResponse.status === 403) {
        sendEvent('error', { error: 'Access denied to Azure OpenAI. Run "az login" and ensure you have the "Cognitive Services OpenAI User" role.' });
      } else {
        sendEvent('error', { error: `Azure OpenAI returned ${aiResponse.status}: ${errorText}` });
      }
      res.end();
      return;
    }

    sendEvent('status', { message: 'AI is generating architecture...' });

    // Read SSE stream from Azure OpenAI
    let fullContent = '';
    let tokenCount = 0;

    const reader = aiResponse.body as any;
    if (!reader || typeof reader[Symbol.asyncIterator] !== 'function') {
      // Fallback: read entire body as text  
      const bodyText = await aiResponse.text();
      // Parse SSE lines
      for (const line of bodyText.split('\n')) {
        if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
          try {
            const json = JSON.parse(line.slice(6));
            const delta = json.choices?.[0]?.delta?.content || '';
            fullContent += delta;
            tokenCount++;
          } catch { /* skip invalid lines */ }
        }
      }
    } else {
      // Node.js readable stream
      const decoder = new TextDecoder();
      let buffer = '';
      for await (const chunk of reader) {
        buffer += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim() !== 'data: [DONE]') {
            try {
              const json = JSON.parse(line.slice(6));
              const delta = json.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullContent += delta;
                tokenCount++;
                if (tokenCount % 40 === 0) {
                  sendEvent('progress', { tokens: tokenCount });
                }
              }
            } catch { /* skip invalid SSE lines */ }
          }
        }
      }
    }

    if (!fullContent) {
      sendEvent('error', { error: 'No response from Azure OpenAI' });
      res.end();
      return;
    }

    sendEvent('status', { message: 'Parsing architecture...' });

    // Extract JSON
    let jsonStr = fullContent.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1].trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('  [AI/Stream] Failed to parse:', fullContent.substring(0, 500));
      sendEvent('error', { error: 'AI returned invalid JSON. Try rephrasing your prompt.' });
      res.end();
      return;
    }

    sendEvent('status', { message: 'Building diagram...' });

    const architecture = parseAIResponse(parsed, title);
    const builder = new DrawIOBuilder();
    const xml = builder.generate(architecture);

    console.log(`  [AI/Stream] Generated ${parsed.resources?.length || 0} resources, ${tokenCount} tokens`);

    sendEvent('result', { xml, architecture, parsed });
    sendEvent('done', {});
    res.end();

  } catch (error: any) {
    console.error('  [Error/Stream] Generation failed:', error);
    try {
      res.write(`event: error\ndata: ${JSON.stringify({ error: error.message || 'Internal server error' })}\n\n`);
    } catch { /* response already ended */ }
    res.end();
  }
});

/**
 * POST /api/generate
 * Generate a Draw.io diagram (non-streaming).
 *
 * Body:
 *   { prompt: string, title?: string, endpoint: string, deploymentName: string, previousArchitecture?: object }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, title, endpoint, deploymentName, previousArchitecture } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // AI mode: use Azure OpenAI with CLI-acquired bearer token
    if (endpoint && deploymentName) {
      if (!isValidAzureEndpoint(endpoint)) {
        return res.status(400).json({ error: 'Invalid Azure OpenAI endpoint. Must be an https://*.openai.azure.com or *.cognitiveservices.azure.com URL.' });
      }
      // Additional strict validation to prevent SSRF: parse and enforce allowed hosts/protocol.
      let endpointUrl: URL;
      try {
        endpointUrl = new URL(endpoint);
      } catch {
        return res.status(400).json({ error: 'Invalid Azure OpenAI endpoint URL format.' });
      }

      if (endpointUrl.protocol !== 'https:') {
        return res.status(400).json({ error: 'Azure OpenAI endpoint must use HTTPS.' });
      }

      const hostname = endpointUrl.hostname.toLowerCase();
      const allowedSuffixes = ['.openai.azure.com', '.cognitiveservices.azure.com'];
      const isAllowedHost = allowedSuffixes.some(suffix => hostname === suffix.slice(1) || hostname.endsWith(suffix));
      if (!isAllowedHost) {
        return res.status(400).json({ error: 'Azure OpenAI endpoint host must be *.openai.azure.com or *.cognitiveservices.azure.com.' });
      }

      if (!isValidDeploymentName(deploymentName)) {
        return res.status(400).json({ error: 'Invalid deploymentName. Must contain only letters, numbers, hyphens, or underscores, and be at most 64 characters long.' });
      }
      console.log(`  [AI] Generating with Azure OpenAI: ${deploymentName}`);

      const token = getAccessToken('https://cognitiveservices.azure.com');
      if (!token) {
        return res.status(401).json({
          error: 'Could not acquire Cognitive Services token. Run "az login" first.',
        });
      }

      // Build the AOAI URL from the normalized origin to avoid SSRF via crafted paths.
      const aoaiUrl = `${endpointUrl.origin}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`;

      // Build messages array (with optional refinement)
      const messages: Array<{ role: string; content: string }> = [
        { role: 'system', content: SYSTEM_PROMPT },
      ];

      if (previousArchitecture) {
        console.log('  [AI] Refinement mode - building on previous architecture');
        messages.push({
          role: 'user',
          content: REFINEMENT_PROMPT + JSON.stringify(previousArchitecture, null, 2) + '\n\nUser changes: ' + prompt,
        });
      } else {
        messages.push({ role: 'user', content: prompt });
      }

      const aiResponse = await fetch(aoaiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // gpt-5 models: no temperature (only default=1 supported),
        // use max_completion_tokens instead of max_tokens
        body: JSON.stringify({
          messages,
          max_completion_tokens: 50000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('  [AI] Azure OpenAI error:', aiResponse.status, errorText);

        // Provide actionable guidance for common errors
        if (aiResponse.status === 401 || aiResponse.status === 403) {
          const isRbac = errorText.includes('PermissionDenied') || errorText.includes('lacks the required');
          const hint = isRbac
            ? '\n\nFix: Assign the "Cognitive Services OpenAI User" role to your account on this Azure OpenAI resource.\n' +
              'Run: az role assignment create --assignee "<your-email>" --role "Cognitive Services OpenAI User" ' +
              '--scope "<resource-id>"'
            : '\n\nEnsure you have data-plane access to this resource. Try running "az login" again.';
          return res.status(aiResponse.status === 401 ? 401 : 403).json({
            error: `Access denied to Azure OpenAI.${hint}`,
          });
        }

        return res.status(502).json({
          error: `Azure OpenAI returned ${aiResponse.status}: ${errorText}`,
        });
      }

      const aiData = (await aiResponse.json()) as any;
      console.log('  [AI] Response keys:', JSON.stringify(Object.keys(aiData)));
      console.log('  [AI] Choice:', JSON.stringify(aiData.choices?.[0]?.message)?.substring(0, 300));
      console.log('  [AI] Finish reason:', aiData.choices?.[0]?.finish_reason);

      // GPT-5 may return content in different fields
      const message = aiData.choices?.[0]?.message;
      const content = message?.content
        || message?.refusal
        || (typeof aiData.output === 'string' ? aiData.output : null)
        || aiData.choices?.[0]?.text;

      if (!content) {
        console.error('  [AI] Full response:', JSON.stringify(aiData).substring(0, 1000));
        return res.status(502).json({
          error: 'No response from Azure OpenAI',
          debug: {
            finishReason: aiData.choices?.[0]?.finish_reason,
            keys: Object.keys(aiData),
            messageKeys: message ? Object.keys(message) : [],
          },
        });
      }

      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content.trim();
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        console.error('  [AI] Failed to parse AI response:', content);
        return res.status(502).json({
          error: 'AI returned invalid JSON. Try rephrasing your prompt.',
        });
      }

      const architecture = parseAIResponse(parsed, title);
      const builder = new DrawIOBuilder();
      const xml = builder.generate(architecture);

      console.log(`  [AI] Generated ${parsed.resources?.length || 0} resources`);
      return res.json({ xml, architecture, parsed });
    }

    // No endpoint/deployment provided
    return res.status(400).json({
      error: 'Azure OpenAI endpoint and deploymentName are required. Select a model in the UI.',
    });
  } catch (error: any) {
    console.error('  [Error] Generation failed:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(resolve(webDistPath, 'index.html'));
});

app.listen(PORT, () => {
  // Check Azure CLI auth on startup
  const account = azCli(['account', 'show']);
  const authStatus = account
    ? `Logged in as ${account.user?.name}`
    : 'Not authenticated — run "az login"';

  console.log('');
  console.log('  ┌─────────────────────────────────────────────┐');
  console.log('  │   Azure Architecture Generator              │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log(`  │   API:   http://localhost:${PORT}                 │`);
  console.log('  │   Web:   http://localhost:5173                │');
  console.log('  ├─────────────────────────────────────────────┤');
  console.log(`  │   Auth:  ${authStatus.padEnd(34)}│`);
  console.log('  └─────────────────────────────────────────────┘');
  console.log('');
  if (!account) {
    console.log('  Run "az login" in another terminal, then refresh the app.');
    console.log('');
  }
});
