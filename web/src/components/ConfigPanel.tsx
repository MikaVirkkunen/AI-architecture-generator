import { useState, useEffect, useCallback } from 'react';
import {
  listSubscriptions,
  listOpenAIResources,
  listDeployments,
} from '../services/azureDiscovery';
import type {
  AuthStatus,
  AzureSubscription,
  AzureOpenAIResource,
  ModelDeployment,
} from '../types';

interface ConfigPanelProps {
  auth: AuthStatus | null;
  onConfigChange: (
    config: {
      endpoint: string;
      deploymentName: string;
      modelInfo: string;
    } | null
  ) => void;
}

export function ConfigPanel({ auth, onConfigChange }: ConfigPanelProps) {
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [selectedSub, setSelectedSub] = useState('');
  const [resources, setResources] = useState<AzureOpenAIResource[]>([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [deployments, setDeployments] = useState<ModelDeployment[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState('');
  const [loading, setLoading] = useState('');
  const [error, setError] = useState('');

  // Load subscriptions when authenticated
  useEffect(() => {
    if (!auth?.authenticated) return;

    setLoading('Loading subscriptions...');
    setError('');

    listSubscriptions()
      .then((subs) => {
        setSubscriptions(subs);
        setLoading('');
      })
      .catch((err) => {
        setError(`Failed to load subscriptions: ${err.message}`);
        setLoading('');
      });
  }, [auth?.authenticated]);

  // Load resources when subscription changes
  useEffect(() => {
    if (!selectedSub) {
      setResources([]);
      return;
    }

    setLoading('Discovering Azure OpenAI resources...');
    setError('');
    setSelectedResource('');
    setDeployments([]);
    setSelectedDeployment('');
    onConfigChange(null);

    listOpenAIResources(selectedSub)
      .then((res) => {
        setResources(res);
        setLoading('');
        if (res.length === 0) {
          setError('No Azure OpenAI resources found in this subscription.');
        }
      })
      .catch((err) => {
        setError(`Failed to load resources: ${err.message}`);
        setLoading('');
      });
  }, [selectedSub]);

  // Load deployments when resource changes
  useEffect(() => {
    if (!selectedResource) {
      setDeployments([]);
      return;
    }

    const resource = resources.find((r) => r.name === selectedResource);
    if (!resource) return;

    setLoading('Loading model deployments...');
    setError('');
    setSelectedDeployment('');
    onConfigChange(null);

    listDeployments(selectedSub, resource.name, resource.resourceGroup)
      .then((deps) => {
        setDeployments(deps);
        setLoading('');
        if (deps.length === 0) {
          setError('No model deployments found.');
        }
      })
      .catch((err) => {
        setError(`Failed to load deployments: ${err.message}`);
        setLoading('');
      });
  }, [selectedResource, resources, selectedSub]);

  // Notify parent when deployment is selected
  const handleDeploymentChange = useCallback(
    (deploymentName: string) => {
      setSelectedDeployment(deploymentName);

      if (!deploymentName) {
        onConfigChange(null);
        return;
      }

      const resource = resources.find((r) => r.name === selectedResource);
      const deployment = deployments.find((d) => d.name === deploymentName);

      if (resource && deployment) {
        onConfigChange({
          endpoint: resource.endpoint,
          deploymentName: deployment.name,
          modelInfo: `${deployment.model} ${deployment.modelVersion}`,
        });
      }
    },
    [resources, selectedResource, deployments, onConfigChange]
  );

  if (!auth?.authenticated) {
    return (
      <div className="config-panel">
        <div className="panel-header">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M10 1L12.39 6.26L18 7.27L14 11.14L14.76 17L10 14.27L5.24 17L6 11.14L2 7.27L7.61 6.26L10 1Z"
              fill="#0078d4"
            />
          </svg>
          <h2>Azure Configuration</h2>
        </div>
        <div className="auth-required">
          <div className="auth-required-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#d2d0ce" strokeWidth="2" fill="none" />
              <path d="M20 12V22M20 26V28" stroke="#d2d0ce" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <p className="auth-required-text">
            Authenticate with Azure CLI to get started:
          </p>
          <code className="auth-required-command">az login</code>
          <p className="auth-required-hint">
            Then refresh this page to select your Azure OpenAI model.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-panel">
      <div className="panel-header">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 1L12.39 6.26L18 7.27L14 11.14L14.76 17L10 14.27L5.24 17L6 11.14L2 7.27L7.61 6.26L10 1Z"
            fill="#0078d4"
          />
        </svg>
        <h2>Azure Configuration</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && (
        <div className="alert alert-info">
          <span className="spinner" />
          {loading}
        </div>
      )}

      <div className="form-group">
        <label>Subscription</label>
        <select
          value={selectedSub}
          onChange={(e) => setSelectedSub(e.target.value)}
          disabled={subscriptions.length === 0}
        >
          <option value="">Select a subscription...</option>
          {subscriptions.map((s) => (
            <option key={s.subscriptionId} value={s.subscriptionId}>
              {s.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Azure OpenAI / AI Services Resource</label>
        <select
          value={selectedResource}
          onChange={(e) => setSelectedResource(e.target.value)}
          disabled={resources.length === 0}
        >
          <option value="">Select a resource...</option>
          {resources.map((r) => {
            const kindLabel = r.kind === 'AIServices' ? 'AI Foundry' : 'OpenAI';
            return (
              <option key={r.name} value={r.name}>
                {r.name} ({r.location}) [{kindLabel}] — {r.chatModelCount} model{r.chatModelCount !== 1 ? 's' : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="form-group">
        <label>Model Deployment</label>
        <select
          value={selectedDeployment}
          onChange={(e) => handleDeploymentChange(e.target.value)}
          disabled={deployments.length === 0}
        >
          <option value="">Select a deployment...</option>
          {deployments.map((d) => (
            <option key={d.name} value={d.name}>
              {d.name} — {d.model} {d.modelVersion}
            </option>
          ))}
        </select>
      </div>

      {selectedDeployment && (
        <div className="rbac-hint">
          <strong>Note:</strong> Your account needs the{' '}
          <em>Cognitive Services OpenAI User</em> role on the selected resource
          to call the model. If you get a 401/403 error, ask your admin to assign it.
        </div>
      )}
    </div>
  );
}
