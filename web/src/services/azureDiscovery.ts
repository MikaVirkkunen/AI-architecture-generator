import type {
  AuthStatus,
  Tenant,
  AzureSubscription,
  AzureOpenAIResource,
  ModelDeployment,
} from '../types';

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    const text = await res.text();
    let msg: string;
    try {
      msg = JSON.parse(text).error || text;
    } catch {
      msg = text;
    }
    throw new Error(msg);
  }
  return res.json();
}

export async function getAuthStatus(): Promise<AuthStatus> {
  return apiGet('/api/auth/status');
}

export async function listTenants(): Promise<Tenant[]> {
  return apiGet('/api/tenants');
}

export async function selectTenant(tenantId: string): Promise<void> {
  const res = await fetch(`/api/tenants/${tenantId}/select`, { method: 'POST' });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to switch tenant');
  }
}

export async function listSubscriptions(): Promise<AzureSubscription[]> {
  return apiGet('/api/subscriptions');
}

export async function listOpenAIResources(
  subscriptionId: string
): Promise<AzureOpenAIResource[]> {
  return apiGet(`/api/subscriptions/${subscriptionId}/openai-resources`);
}

export async function listDeployments(
  subscriptionId: string,
  resourceName: string,
  resourceGroup: string
): Promise<ModelDeployment[]> {
  return apiGet(
    `/api/subscriptions/${subscriptionId}/openai-resources/${resourceName}/deployments?rg=${encodeURIComponent(resourceGroup)}`
  );
}
