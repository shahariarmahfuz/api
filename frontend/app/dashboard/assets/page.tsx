'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Image as ImageIcon,
  ExternalLink,
  UploadCloud,
  Calendar,
  Layers,
  ArrowUpRight,
  Maximize2,
  X,
  FileImage,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function UserAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await api.getMyAssets({ page_size: 50 });
      setAssets(res.data || []);
    } catch (err) {
      console.error('Failed to load user assets:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-emerald-400" />
            <span>Uploaded Assets</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            View and manage images uploaded via the Cloudinary Image Upload API.
          </p>
        </div>
        <Link
          href="/apis/cloudinary-image-upload"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload Image via API</span>
        </Link>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading uploaded assets...
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-white/[0.08] bg-[#050505] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#080808] border border-white/[0.08] flex items-center justify-center text-zinc-500 mx-auto mb-4">
            <FileImage className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No uploaded assets yet</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            You haven't uploaded any images yet. Use your API Key to post images to{' '}
            <code className="text-zinc-200">/api/v1/image/upload</code> or test it directly in the documentation playground.
          </p>
          <Link
            href="/apis/cloudinary-image-upload"
            className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-lg bg-[#080808] border border-white/[0.08] hover:bg-[#121212] text-zinc-200 text-xs font-semibold transition-colors"
          >
            <span>Open Image Upload Playground</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className="rounded-xl border border-white/[0.08] bg-[#050505] overflow-hidden group hover:border-white/[0.16] transition-all flex flex-col"
            >
              {/* Image Preview Container */}
              <div
                className="relative aspect-video bg-black overflow-hidden cursor-pointer"
                onClick={() => setPreviewAsset(asset)}
              >
                <img
                  src={asset.secure_url}
                  alt={asset.cloudinary_public_id}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="p-2 rounded-lg bg-[#080808]/90 text-zinc-200 hover:text-white">
                    <Maximize2 className="w-4 h-4" />
                  </span>
                </div>
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-black/70 text-zinc-200 border border-white/10 backdrop-blur-sm">
                  {asset.format}
                </span>
              </div>

              {/* Metadata Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="font-mono text-xs text-zinc-200 truncate font-semibold" title={asset.cloudinary_public_id}>
                    {asset.cloudinary_public_id}
                  </div>
                  <div className="text-[11px] font-mono text-zinc-400 mt-1 flex items-center justify-between">
                    <span>{asset.width} × {asset.height} px</span>
                    <span>{(asset.bytes / 1024).toFixed(1)} KB</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-zinc-500">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                  <a
                    href={asset.secure_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-sans font-medium"
                  >
                    <span>Cloudinary</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Preview */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#050505] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#080808]">
              <span className="font-mono text-xs text-zinc-200 font-semibold truncate max-w-md">
                {previewAsset.cloudinary_public_id}
              </span>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/50 max-h-[60vh] overflow-hidden">
              <img
                src={previewAsset.secure_url}
                alt={previewAsset.cloudinary_public_id}
                className="max-h-[55vh] object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-[#080808] border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="space-x-3 text-zinc-400">
                <span>Format: <strong className="text-zinc-200">{previewAsset.format.toUpperCase()}</strong></span>
                <span>Dimensions: <strong className="text-zinc-200">{previewAsset.width}×{previewAsset.height}</strong></span>
                <span>Size: <strong className="text-zinc-200">{(previewAsset.bytes / 1024).toFixed(1)} KB</strong></span>
              </div>
              <a
                href={previewAsset.secure_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] border border-white/[0.08] text-zinc-200 hover:bg-[#121212] font-sans text-xs font-semibold"
              >
                <span>Open CDN Asset</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
