export interface AuthStatus {
  authenticated: boolean;
  message?: string;
  user?: {
    name: string;
    type: string;
    tenantId: string;
    subscriptionName: string;
    subscriptionId: string;
  };
}

export interface Tenant {
  tenantId: string;
  displayName: string;
}

export interface AzureSubscription {
  subscriptionId: string;
  displayName: string;
  state: string;
  tenantId: string;
}

export interface AzureOpenAIResource {
  id: string;
  name: string;
  kind: string;
  location: string;
  endpoint: string;
  resourceGroup: string;
  chatModelCount: number;
}

export interface ModelDeployment {
  name: string;
  model: string;
  modelVersion: string;
  scaleType: string;
}

export interface GenerateRequest {
  prompt: string;
  title?: string;
  endpoint?: string;
  deploymentName?: string;
}

export interface GenerateResponse {
  xml: string;
  architecture: any;
  parsed: {
    resources: Array<{
      type: string;
      name: string;
      count?: number;
    }>;
    connections?: Array<{
      from: string;
      to: string;
    }>;
  };
}
