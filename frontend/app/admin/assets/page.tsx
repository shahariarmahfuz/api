'use client';

import React, { useEffect, useState } from 'react';
import {
  Image as ImageIcon,
  ExternalLink,
  Search,
  Maximize2,
  X,
  FileImage,
  User as UserIcon,
  HardDrive,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAssets({ page_size: 100 });
      setAssets(res.data || []);
    } catch (err) {
      console.error('Failed to load admin assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = assets.filter(
    (a) =>
      a.cloudinary_public_id.toLowerCase().includes(search.toLowerCase()) ||
      a.user_id.toLowerCase().includes(search.toLowerCase()) ||
      a.format.toLowerCase().includes(search.toLowerCase())
  );

  const totalBytes = assets.reduce((acc, curr) => acc + (curr.bytes || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <ImageIcon className="w-6 h-6 text-emerald-400" />
            <span>Platform Uploaded Assets</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400">
            Audit and inspect all image assets uploaded across the platform via Cloudinary.
          </p>
        </div>

        {/* Global Summary Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#050505] border border-white/[0.08] text-xs font-mono text-zinc-300 flex items-center gap-2">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Total Storage: {(totalBytes / (1024 * 1024)).toFixed(2)} MB</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#050505] border border-white/[0.08] text-xs font-mono text-zinc-300">
            <span>Assets: {assets.length}</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Public ID, User ID, format..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#080808] border border-white/[0.08] rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 font-mono transition-colors"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-zinc-500">
          Loading platform assets...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.08] bg-[#050505] p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#080808] border border-white/[0.08] flex items-center justify-center text-zinc-500 mx-auto mb-4">
            <FileImage className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No assets found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            No image assets match your query or none have been uploaded yet.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.08] bg-[#050505] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#080808] text-zinc-400">
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">Cloudinary Public ID</th>
                  <th className="py-3 px-4">User ID</th>
                  <th className="py-3 px-4">Format</th>
                  <th className="py-3 px-4">Resolution</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Uploaded At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filtered.map((asset) => (
                  <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-4">
                      <div
                        className="w-12 h-12 rounded-lg bg-[#080808] border border-white/[0.08] overflow-hidden cursor-pointer relative group shrink-0"
                        onClick={() => setPreviewAsset(asset)}
                      >
                        <img
                          src={asset.secure_url}
                          alt={asset.cloudinary_public_id}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                          loading="lazy"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-zinc-200">
                      <div className="max-w-xs truncate" title={asset.cloudinary_public_id}>
                        {asset.cloudinary_public_id}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-zinc-400">
                      <div className="max-w-[140px] truncate" title={asset.user_id}>
                        {asset.user_id}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 uppercase font-semibold text-[10px]">
                        {asset.format}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {asset.width} × {asset.height}
                    </td>
                    <td className="py-3 px-4 text-zinc-300">
                      {(asset.bytes / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 text-zinc-500">
                      {new Date(asset.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setPreviewAsset(asset)}
                          className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-400 hover:text-white transition-colors"
                          title="Preview full image"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <a
                          href={asset.secure_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/[0.04] text-zinc-400 hover:text-emerald-400 transition-colors"
                          title="Open CDN link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Preview */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-3xl rounded-2xl border border-white/[0.08] bg-[#050505] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-[#080808]">
              <span className="font-mono text-xs text-zinc-200 font-semibold truncate max-w-md">
                {previewAsset.cloudinary_public_id}
              </span>
              <button
                onClick={() => setPreviewAsset(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.04]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black max-h-[60vh] overflow-hidden">
              <img
                src={previewAsset.secure_url}
                alt={previewAsset.cloudinary_public_id}
                className="max-h-[55vh] object-contain rounded-lg"
              />
            </div>
            <div className="p-4 bg-[#080808] border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="space-x-3 text-zinc-400">
                <span>Owner: <strong className="text-zinc-200">{previewAsset.user_id}</strong></span>
                <span>Format: <strong className="text-zinc-200">{previewAsset.format.toUpperCase()}</strong></span>
                <span>Dimensions: <strong className="text-zinc-200">{previewAsset.width}×{previewAsset.height}</strong></span>
                <span>Size: <strong className="text-zinc-200">{(previewAsset.bytes / 1024).toFixed(1)} KB</strong></span>
              </div>
              <a
                href={previewAsset.secure_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white font-sans text-xs font-semibold border border-white/[0.08] transition-colors"
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
