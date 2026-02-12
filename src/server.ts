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
import { execSync } from 'node:child_process';
import { generate } from './index.js';
import { SYSTEM_PROMPT, parseAIResponse } from './ai/parser.js';
import { DrawIOBuilder } from './drawio/xml-builder.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from built web app (production)
const webDistPath = resolve(__dirname, '../web/dist');
app.use(express.static(webDistPath));

// ==================== Azure CLI helpers ====================

function azCli(command: string): any {
  try {
    const output = execSync(`az ${command} -o json 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 30000,
    });
    return JSON.parse(output);
  } catch {
    return null;
  }
}

function getAccessToken(resource: string): string | null {
  try {
    const result = azCli(`account get-access-token --resource ${resource}`);
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
  const account = azCli('account show');
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
 * List available tenants
 */
app.get('/api/tenants', (_req, res) => {
  const tenants = azCli('account tenant list');
  if (!tenants) {
    return res.status(401).json({ error: 'Not authenticated. Run "az login" first.' });
  }
  res.json(
    tenants.map((t: any) => ({
      tenantId: t.tenantId,
      displayName: t.displayName || t.tenantId,
    }))
  );
});

/**
 * POST /api/tenants/:tenantId/select
 * Switch active tenant
 */
app.post('/api/tenants/:tenantId/select', (req, res) => {
  const { tenantId } = req.params;
  try {
    execSync(`az login --tenant ${tenantId} --allow-no-subscriptions -o none 2>/dev/null`, {
      encoding: 'utf-8',
      timeout: 60000,
    });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: `Failed to switch tenant: ${err.message}` });
  }
});

/**
 * GET /api/subscriptions
 * List available subscriptions
 */
app.get('/api/subscriptions', (_req, res) => {
  const subs = azCli('account subscription list');
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
  const deployments = azCli(
    `cognitiveservices account deployment list --subscription ${subId} --name ${name} --resource-group "${rg}"`
  );
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

  // Fetch ALL Cognitive Services accounts and filter client-side for reliability
  const allResources = azCli(
    `cognitiveservices account list --subscription ${subId}`
  );
  if (!allResources) {
    return res.status(500).json({ error: 'Failed to list Cognitive Services resources. Check your subscription access.' });
  }

  // Include OpenAI (standalone), AIServices (Foundry/multi-service), and CognitiveServices with OpenAI endpoints
  const openAIKinds = new Set(['OpenAI', 'AIServices']);
  const candidates = allResources.filter((r: any) => {
    if (openAIKinds.has(r.kind)) return true;
    const ep = r.properties?.endpoint || '';
    return ep.includes('.openai.azure.com') || ep.includes('.cognitiveservices.azure.com');
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

  const chatDeploys = getChatDeployments(subId, name, rg);
  if (chatDeploys.length === 0) {
    return res.json([]);
  }
  res.json(chatDeploys);
});

// ==================== Generation route ====================

/**
 * POST /api/generate
 * Generate a Draw.io diagram.
 *
 * Body:
 *   { prompt: string, title?: string, endpoint: string, deploymentName: string }
 */
app.post('/api/generate', async (req, res) => {
  try {
    const { prompt, title, endpoint, deploymentName } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // AI mode: use Azure OpenAI with CLI-acquired bearer token
    if (endpoint && deploymentName) {
      console.log(`  [AI] Generating with Azure OpenAI: ${deploymentName}`);

      const token = getAccessToken('https://cognitiveservices.azure.com');
      if (!token) {
        return res.status(401).json({
          error: 'Could not acquire Cognitive Services token. Run "az login" first.',
        });
      }

      const aoaiUrl = `${endpoint.replace(/\/$/, '')}/openai/deployments/${deploymentName}/chat/completions?api-version=2024-02-01`;

      const aiResponse = await fetch(aoaiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // gpt-5 models: no temperature (only default=1 supported),
        // use max_completion_tokens instead of max_tokens
        body: JSON.stringify({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
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
  const account = azCli('account show');
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
