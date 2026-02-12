import { useState } from 'react';
import type { AuthStatus, GenerateResponse } from '../types';

interface GeneratePanelProps {
  auth: AuthStatus | null;
  config: {
    endpoint: string;
    deploymentName: string;
    modelInfo: string;
  } | null;
  onGenerated: (result: GenerateResponse) => void;
  onError: (error: string) => void;
}

const EXAMPLE_PROMPTS = [
  '3 VMs with VNET, storage account, and CosmosDB backend',
  'Hub and spoke network with firewall, bastion, and VPN gateway',
  'HA dual region hub-spoke with ExpressRoute and on-premises connectivity',
  'Web app with App Gateway, AKS cluster, SQL Database, and Key Vault',
  'Microservices with AKS, API Management, Service Bus, and CosmosDB',
];

export function GeneratePanel({
  auth,
  config,
  onGenerated,
  onError,
}: GeneratePanelProps) {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mode, setMode] = useState<'ai' | 'simple'>('simple');

  const canGenerate =
    prompt.trim().length > 0 && (mode === 'simple' || config);

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    onError('');

    try {
      let body: any = { prompt, title: title || undefined };

      if (mode === 'ai' && config) {
        body = {
          ...body,
          endpoint: config.endpoint,
          deploymentName: config.deploymentName,
        };
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Generation failed: ${text}`);
      }

      const result: GenerateResponse = await res.json();
      onGenerated(result);
    } catch (err: any) {
      onError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="generate-panel">
      <div className="panel-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <rect
            x="2"
            y="3"
            width="16"
            height="14"
            rx="2"
            stroke="#0078d4"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M5 8H15M5 12H11"
            stroke="#0078d4"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h2>Generate Architecture</h2>
      </div>

      <div className="mode-toggle">
        <button
          className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
          onClick={() => setMode('simple')}
        >
          Simple Mode
        </button>
        <button
          className={`mode-btn ${mode === 'ai' ? 'active' : ''}`}
          onClick={() => setMode('ai')}
          disabled={!auth?.authenticated || !config}
          title={
            !config ? 'Select an Azure OpenAI model first' : ''
          }
        >
          AI Mode {config ? `(${config.modelInfo})` : ''}
        </button>
      </div>

      <div className="form-group">
        <label>
          Diagram Title{' '}
          <span className="optional">(optional)</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My Azure Architecture"
        />
      </div>

      <div className="form-group">
        <label>Describe your architecture</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Hub and spoke network with 3 VMs, firewall, and CosmosDB backend..."
          rows={4}
        />
      </div>

      <div className="example-prompts">
        <span className="example-label">Examples:</span>
        <div className="example-chips">
          {EXAMPLE_PROMPTS.map((ex, i) => (
            <button
              key={i}
              className="chip"
              onClick={() => setPrompt(ex)}
            >
              {ex.length > 55 ? ex.slice(0, 55) + '...' : ex}
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary btn-generate"
        onClick={handleGenerate}
        disabled={!canGenerate || isGenerating}
      >
        {isGenerating ? (
          <>
            <span className="spinner" />
            Generating...
          </>
        ) : (
          <>
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
            >
              <path
                d="M9 2L11 7H16L12 10L13 15L9 12L5 15L6 10L2 7H7L9 2Z"
                fill="currentColor"
              />
            </svg>
            Generate Diagram
          </>
        )}
      </button>
    </div>
  );
}
