import React from 'react';
import { CodeBlock } from '@/components/CodeBlock';

export default function GettingStartedPage() {
  const curlExample = `curl -X POST "http://localhost:8000/api/v1/image/upload" \\
  -H "X-API-Key: YOUR_ORVIA_API_KEY" \\
  -F "file=@image.jpg"`;

  const responseExample = `{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/diwp8ug1r/image/upload/...",
    "secure_url": "https://res.cloudinary.com/diwp8ug1r/image/upload/...",
    "public_id": "orvia/orvia_live_production_xzg9ns",
    "format": "jpg",
    "width": 1200,
    "height": 800,
    "bytes": 245120
  },
  "request_id": "req_9c6c3d04-92aa-4da0-92c6-c63f5417713d"
}`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Getting Started with Orvia
        </h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          Quick start guide for interacting with the Orvia API platform.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">1. Base URL</h2>
        <p className="text-xs text-zinc-400">
          All Orvia API endpoints are served over HTTPS in production and prefixed by the API version.
        </p>
        <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-emerald-400">
          http://localhost:8000/api/v1
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">2. Obtain an API Key</h2>
        <p className="text-xs text-zinc-400">
          Head to the <a href="/dashboard/api-keys" className="text-emerald-400 hover:underline">API Keys</a> section in your dashboard to generate your secret key. Keys start with the prefix <code className="text-zinc-200">orv_live_</code>.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">3. Send Your First Request</h2>
        <p className="text-xs text-zinc-400">
          Include your secret key in the <code className="text-zinc-200">X-API-Key</code> request header.
        </p>
        <CodeBlock code={curlExample} language="bash" title="Terminal cURL" />

        <h3 className="text-sm font-semibold text-zinc-200 mt-4">Expected Response:</h3>
        <CodeBlock code={responseExample} language="json" title="200 OK Response" />
      </section>
    </div>
  );
}
