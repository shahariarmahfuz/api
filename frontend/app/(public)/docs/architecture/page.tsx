import React from 'react';
import { CodeBlock } from '@/components/CodeBlock';

export default function ArchitectureDocsPage() {
  const manifestExample = `from app.modules.manifest import ApiModuleManifest
 
cloudinary_upload_manifest = ApiModuleManifest(
    name="Cloudinary Image Upload",
    slug="cloudinary-image-upload",
    category="image",
    version="v1",
    method="POST",
    endpoint="/api/v1/image/upload",
    description="Secure image upload with instant CDN hosting.",
    status="active",
    authentication_required=True,
    rate_limit="60/min",
    documentation={
        "parameters": [
            {"name": "file", "type": "binary", "required": True, "description": "The image file (JPEG, PNG, WebP, GIF)"}
        ]
    }
)`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Modular Architecture & Extension Guide
        </h1>
        <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
          The core philosophy of Orvia is extreme modularity. Each API is an autonomous module with its own route, service, schema, and documentation.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Future API Addition Workflow</h2>
        <div className="relative border-l border-zinc-800 ml-4 pl-6 space-y-6 text-xs text-zinc-300">
          <div>
            <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-zinc-900 border border-emerald-500/80 flex items-center justify-center text-[10px] font-mono text-emerald-400">
              1
            </div>
            <h3 className="text-sm font-semibold text-white">Create Schema & Validation</h3>
            <p className="text-zinc-400 mt-1">
              Define Pydantic input and output schemas in <code className="text-zinc-200">backend/app/schemas/</code>.
            </p>
          </div>

          <div>
            <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-zinc-900 border border-emerald-500/80 flex items-center justify-center text-[10px] font-mono text-emerald-400">
              2
            </div>
            <h3 className="text-sm font-semibold text-white">Create Business Service</h3>
            <p className="text-zinc-400 mt-1">
              Implement pure business logic isolated inside <code className="text-zinc-200">backend/app/services/</code>.
            </p>
          </div>

          <div>
            <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-zinc-900 border border-emerald-500/80 flex items-center justify-center text-[10px] font-mono text-emerald-400">
              3
            </div>
            <h3 className="text-sm font-semibold text-white">Create Route Handler</h3>
            <p className="text-zinc-400 mt-1">
              Mount endpoint handlers using FastAPI APIRouter under <code className="text-zinc-200">backend/app/api/v1/routes/</code>.
            </p>
          </div>

          <div>
            <div className="absolute -left-2.5 w-5 h-5 rounded-full bg-zinc-900 border border-emerald-500/80 flex items-center justify-center text-[10px] font-mono text-emerald-400">
              4
            </div>
            <h3 className="text-sm font-semibold text-white">Register Module Manifest</h3>
            <p className="text-zinc-400 mt-1">
              Declare an <code className="text-zinc-200">ApiModuleManifest</code>. On application startup, Orvia automatically syncs it to the database registry!
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">Manifest Specification Example</h2>
        <CodeBlock code={manifestExample} language="python" title="Module Manifest Definition" />
      </section>
    </div>
  );
}
