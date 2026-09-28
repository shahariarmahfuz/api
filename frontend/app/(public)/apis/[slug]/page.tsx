'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Lock,
  Globe,
  Gauge,
  Clock,
  Check,
  Copy,
  Terminal,
  FileCode2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { ApiRegistryItem } from '@/types';
import { MethodBadge, StatusBadge, CategoryBadge } from '@/components/Badge';
import { CodeBlock } from '@/components/CodeBlock';
import { Playground } from '@/components/Playground';

export default function ApiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [apiData, setApiData] = useState<ApiRegistryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'js'>('curl');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.getApiBySlug(slug)
      .then((res) => {
        setApiData(res.data);
      })
      .catch((err) => {
        setError(err.message || 'API endpoint not found');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-mono text-zinc-500">Loading API specification...</p>
      </div>
    );
  }

  if (error || !apiData) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">API Specification Not Found</h2>
        <p className="text-sm text-zinc-400 mt-2">
          The requested API endpoint '{slug}' could not be resolved in the Orvia registry.
        </p>
        <Link
          href="/apis"
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm hover:bg-zinc-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const doc = apiData.documentation || {};
  const parameters = doc.parameters || [];
  const reqExample = doc.request_example || {};
  const resExample = doc.response_example || {};
  const errorResponses = doc.error_responses || [];

  // Generate code snippets
  const baseUrl = 'http://localhost:8000';
  const fullUrl = `${baseUrl}${apiData.endpoint}`;
  const isMultipart = apiData.endpoint.includes('/image/upload');

  const curlCode = isMultipart
    ? `curl -X POST "${fullUrl}" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "file=@photo.jpg"`
    : apiData.method.toUpperCase() === 'GET'
      ? `curl -X GET "${fullUrl}" \\
  -H "X-API-Key: YOUR_API_KEY"`
      : `curl -X ${apiData.method.toUpperCase()} "${fullUrl}" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(reqExample)}'`;

  const pythonCode = isMultipart
    ? `import requests

url = "${fullUrl}"
headers = {
    "X-API-Key": "YOUR_API_KEY"
}
with open("photo.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post(url, headers=headers, files=files)

print(response.status_code)
print(response.json())`
    : `import requests

url = "${fullUrl}"
headers = {
    "X-API-Key": "YOUR_API_KEY",
    "Content-Type": "application/json"
}
${
  apiData.method.toUpperCase() === 'GET'
    ? 'response = requests.get(url, headers=headers)'
    : `payload = ${JSON.stringify(reqExample, null, 4)}
response = requests.post(url, json=payload, headers=headers)`
}

print(response.status_code)
print(response.json())`;

  const jsCode = isMultipart
    ? `const formData = new FormData();
formData.append("file", fileInput.files[0]);

const response = await fetch("${fullUrl}", {
  method: "POST",
  headers: {
    "X-API-Key": "YOUR_API_KEY",
  },
  body: formData,
});

const data = await response.json();
console.log(data);`
    : `const response = await fetch("${fullUrl}", {
  method: "${apiData.method.toUpperCase()}",
  headers: {
    "X-API-Key": "YOUR_API_KEY",
    "Content-Type": "application/json",
  },
  ${apiData.method.toUpperCase() !== 'GET' ? `body: JSON.stringify(${JSON.stringify(reqExample, null, 2)})` : ''}
});

const data = await response.json();
console.log(data);`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb / Back button */}
      <div className="mb-6">
        <Link
          href="/apis"
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to API Catalog</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="p-6 rounded-2xl border border-white/[0.08] bg-[#050505] shadow-2xl mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2.5">
            <MethodBadge method={apiData.method} size="md" />
            <CategoryBadge category={apiData.category} />
            <StatusBadge status={apiData.status} />
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Version {apiData.version}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {apiData.name}
        </h1>

        <p className="mt-2 text-sm sm:text-base text-zinc-300 leading-relaxed max-w-3xl">
          {apiData.description}
        </p>

        {/* Telemetry Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/[0.06] text-xs font-mono">
          <div>
            <span className="text-zinc-500 block mb-1">HTTP Endpoint</span>
            <span className="text-zinc-200 font-semibold truncate block">
              {apiData.endpoint}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">Authentication</span>
            <span className="text-zinc-200 font-semibold flex items-center gap-1">
              {apiData.authentication_required ? (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Required (X-API-Key)</span>
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Public Access</span>
                </>
              )}
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">Rate Limit</span>
            <span className="text-zinc-200 font-semibold flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-indigo-400" />
              <span>{apiData.rate_limit}</span>
            </span>
          </div>
          <div>
            <span className="text-zinc-500 block mb-1">Last Updated</span>
            <span className="text-zinc-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{new Date(apiData.updated_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Playground Sandbox */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Live API Playground</h2>
        </div>
        <p className="text-xs text-zinc-400 mb-4">
          Execute live sandbox requests against this endpoint. Real-time response inspection and latency audit.
        </p>
        <Playground
          slug={apiData.slug}
          method={apiData.method}
          endpoint={apiData.endpoint}
          authRequired={apiData.authentication_required}
          defaultPayload={reqExample}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Parameters and Errors */}
        <div className="space-y-8">
          {/* Request Parameters */}
          <section className="p-6 rounded-xl border border-white/[0.08] bg-[#050505]">
            <h3 className="text-base font-bold text-white mb-4">
              Request Parameters
            </h3>
            {parameters.length === 0 ? (
              <p className="text-xs text-zinc-500">
                This endpoint does not accept body or query parameters.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {parameters.map((param, idx) => (
                  <div key={idx} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between font-mono text-xs mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200">{param.name}</span>
                        <span className="text-zinc-500">{param.type}</span>
                      </div>
                      {param.required ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950/60 text-rose-300 border border-rose-800/50">
                          required
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400">
                          optional
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">{param.description}</p>
                    {param.example !== undefined && (
                      <p className="text-[11px] font-mono text-zinc-500 mt-1">
                        Example: <code className="text-zinc-300">{String(param.example)}</code>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Error Responses */}
          {errorResponses.length > 0 && (
            <section className="p-6 rounded-xl border border-white/[0.08] bg-[#050505]">
              <h3 className="text-base font-bold text-white mb-4">
                Error Responses
              </h3>
              <div className="space-y-3">
                {errorResponses.map((err, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-white/[0.08] bg-[#080808] text-xs font-mono"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-rose-400 font-semibold">{err.code}</span>
                      <span className="text-zinc-500">HTTP {err.status}</span>
                    </div>
                    <p className="text-zinc-400 font-sans text-xs">{err.message}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Code Snippets & Response Sample */}
        <div className="space-y-8">
          {/* Code Examples Tabs */}
          <section className="p-6 rounded-xl border border-white/[0.08] bg-[#050505]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Client Code</h3>
              <div className="flex items-center gap-1 text-xs font-mono">
                {(['curl', 'python', 'js'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      activeCodeTab === tab
                        ? 'bg-[#080808] border border-white/[0.1] text-white font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {activeCodeTab === 'curl' && (
              <CodeBlock code={curlCode} language="bash" title="cURL" />
            )}
            {activeCodeTab === 'python' && (
              <CodeBlock code={pythonCode} language="python" title="Python 3" />
            )}
            {activeCodeTab === 'js' && (
              <CodeBlock code={jsCode} language="javascript" title="Node / Browser Fetch" />
            )}
          </section>

          {/* Sample Response */}
          <section className="p-6 rounded-xl border border-white/[0.08] bg-[#050505]">
            <h3 className="text-base font-bold text-white mb-2">
              Response Schema (200 OK)
            </h3>
            <p className="text-xs text-zinc-400 mb-3">
              Standardized JSON response envelope returned by Orvia.
            </p>
            <div className="p-4 rounded-lg bg-[#080808] border border-white/[0.08] font-mono text-xs overflow-x-auto text-emerald-300">
              <pre>{JSON.stringify(resExample, null, 2)}</pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
