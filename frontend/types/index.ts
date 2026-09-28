export interface ApiDocumentation {
  summary?: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
    example?: any;
  }>;
  request_example?: Record<string, any>;
  response_example?: Record<string, any>;
  error_responses?: Array<{
    code: string;
    status: number;
    message: string;
  }>;
  tags?: string[];
  code_examples?: Array<{
    language: string;
    code: string;
  }>;
}

export interface ApiRegistryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  method: string;
  endpoint: string;
  status: 'active' | 'beta' | 'deprecated' | 'disabled';
  authentication_required: boolean;
  rate_limit: string;
  documentation: ApiDocumentation;
  created_at: string;
  updated_at: string;
}

export interface CategorySummary {
  category: string;
  count: number;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key_prefix: string;
  owner_id?: string;
  status: 'active' | 'revoked' | 'expired';
  rate_limit: string;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
}

export interface ApiKeyCreated extends ApiKeyItem {
  secret_key: string;
}

export interface RequestLogItem {
  id: string;
  request_id: string;
  api_id?: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  ip_address?: string;
  api_key_id?: string;
  user_id?: string;
  timestamp: string;
  created_at: string;
}

export interface SystemOverview {
  app_name: string;
  version: string;
  environment: string;
  total_apis: number;
  total_keys: number;
  total_requests: number;
  avg_latency_ms: number;
  success_rate: number;
  database: {
    status: string;
    latency_ms: number;
    database: string;
    driver: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  request_id?: string;
}

export interface StandardResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  request_id?: string;
}
