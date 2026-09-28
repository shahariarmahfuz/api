import React from 'react';
import { CodeBlock } from '@/components/CodeBlock';

export default function AuthenticationDocsPage() {
  const apiKeyHeaderExample = `X-API-Key: orv_live_9f8a123456789abcdef0123456789abc`;
  const bearerHeaderExample = `Authorization: Bearer orv_live_9f8a123456789abcdef0123456789abc`;
  const errorExample = `{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Missing required API key. Provide via 'X-API-Key' header."
  },
  "request_id": "84d720ea-1234-4567-89ab-cdef01234567"
}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Authentication
        </h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Orvia supports decoupled authentication using secure API keys for programmatic access and JWT Bearer tokens for the administrative console.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">API Key Authentication</h2>
        <p className="text-xs text-zinc-400">
          APIs that specify <code className="text-zinc-200">authentication_required = true</code> mandate an active API key. You can supply the key through either of the following headers:
        </p>
        <div className="space-y-3">
          <div>
            <span className="text-xs font-mono text-zinc-300">Option 1 (Recommended): Custom Header</span>
            <CodeBlock code={apiKeyHeaderExample} language="http" title="Header" />
          </div>
          <div>
            <span className="text-xs font-mono text-zinc-300">Option 2: Bearer Authorization Header</span>
            <CodeBlock code={bearerHeaderExample} language="http" title="Header" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Authentication Errors</h2>
        <p className="text-xs text-zinc-400">
          If an API key is missing, invalid, revoked, or expired, Orvia returns an HTTP 401 response with standard error details:
        </p>
        <CodeBlock code={errorExample} language="json" title="HTTP 401 Response" />
      </section>
    </div>
  );
}
