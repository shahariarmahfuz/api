'use client';

import React, { useState, useRef } from 'react';
import { Play, Loader2, Key, CheckCircle, AlertTriangle, UploadCloud, Image as ImageIcon, ExternalLink } from 'lucide-react';
import { MethodBadge } from './Badge';
import { api } from '@/lib/api';

interface PlaygroundProps {
  slug: string;
  method: string;
  endpoint: string;
  authRequired: boolean;
  defaultPayload?: Record<string, any>;
}

export function Playground({
  slug,
  method,
  endpoint,
  authRequired,
  defaultPayload = {},
}: PlaygroundProps) {
  const isImageUpload = endpoint.includes('/image/upload') || slug === 'cloudinary-image-upload';
  const [apiKey, setApiKey] = useState('orv_live_demo_platform_key_2026_modular');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [payloadStr, setPayloadStr] = useState(
    JSON.stringify(defaultPayload, null, 2)
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    const start = performance.now();

    try {
      if (isImageUpload) {
        if (!selectedFile) {
          throw new Error('Please select an image file (JPEG, PNG, WebP, GIF) to upload.');
        }
        const res = await api.uploadImage(selectedFile, apiKey);
        setLatency(Math.round(performance.now() - start));
        setResult(res);
      } else {
        let parsedPayload = {};
        if (payloadStr.trim()) {
          try {
            parsedPayload = JSON.parse(payloadStr);
          } catch (e) {
            throw new Error('Invalid JSON payload syntax.');
          }
        }

        const res = await api.executeTest(
          slug,
          parsedPayload,
          authRequired ? apiKey : undefined
        );
        setLatency(Math.round(performance.now() - start));
        setResult(res);
      }
    } catch (err: any) {
      setLatency(Math.round(performance.now() - start));
      setError(err.message || 'Execution error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#050505] overflow-hidden my-6">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.06] bg-[#080808] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <MethodBadge method={method} size="md" />
          <span className="font-mono text-sm text-zinc-200 font-semibold">{endpoint}</span>
        </div>
        <button
          onClick={handleExecute}
          disabled={loading || (isImageUpload && !selectedFile)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{isImageUpload ? 'Uploading...' : 'Executing...'}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isImageUpload ? 'Upload Image' : 'Send Request'}</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* API Key input if required */}
        {authRequired && (
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-zinc-400" />
              <span>API Key (Header: X-API-Key)</span>
            </label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="orv_live_..."
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600"
            />
          </div>
        )}

        {/* File upload for image endpoint */}
        {isImageUpload ? (
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-2 flex items-center gap-1.5">
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multipart File (file: JPEG, PNG, WebP, GIF - max 10MB)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 rounded-xl p-6 text-center cursor-pointer transition-colors"
            >
              {filePreview ? (
                <div className="flex flex-col items-center gap-3">
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-contain border border-zinc-700 shadow-md"
                  />
                  <div className="text-xs font-mono text-zinc-300">
                    {selectedFile?.name} ({(selectedFile?.size ? (selectedFile.size / 1024).toFixed(1) : 0)} KB)
                  </div>
                  <span className="text-[11px] text-emerald-400 hover:underline">
                    Click to choose a different image
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-medium text-zinc-200">
                    Click to select an image from your device
                  </div>
                  <div className="text-[11px] text-zinc-500">
                    Supports JPEG, PNG, WebP, GIF up to 10MB
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Request Payload */
          method.toUpperCase() !== 'GET' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono text-zinc-400">Request Body (JSON)</label>
                <button
                  onClick={() => {
                    try {
                      setPayloadStr(JSON.stringify(JSON.parse(payloadStr), null, 2));
                    } catch (e) {}
                  }}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 font-mono"
                >
                  Format JSON
                </button>
              </div>
              <textarea
                rows={4}
                value={payloadStr}
                onChange={(e) => setPayloadStr(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-200 focus:outline-none focus:border-zinc-600 resize-y"
              />
            </div>
          )
        )}

        {/* Result Area */}
        {(result || error) && (
          <div className="pt-3 border-t border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {result ? (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono">
                    <CheckCircle className="w-3.5 h-3.5" />
                    200 OK
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium font-mono">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Request Error
                  </span>
                )}
              </div>
              {latency !== null && (
                <span className="text-[11px] font-mono text-zinc-500">
                  Latency: {latency} ms
                </span>
              )}
            </div>

            {/* Cloudinary Result Preview */}
            {result?.data?.secure_url && (
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-emerald-500/20 flex flex-wrap items-center gap-4">
                <img
                  src={result.data.secure_url}
                  alt="Cloudinary result"
                  className="w-20 h-20 object-cover rounded-lg border border-zinc-700 shadow"
                />
                <div className="space-y-1 text-xs">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <span>Uploaded to Cloudinary CDN</span>
                    <a
                      href={result.data.secure_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-400 hover:text-white"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="font-mono text-zinc-300 text-[11px]">
                    Dimensions: {result.data.width}x{result.data.height}px | Format: {result.data.format} | Size: {(result.data.bytes / 1024).toFixed(1)} KB
                  </div>
                  <div className="font-mono text-zinc-400 text-[10px] truncate max-w-sm">
                    Public ID: {result.data.public_id}
                  </div>
                </div>
              </div>
            )}

            <div className="p-3 rounded-lg bg-[#07080d] border border-zinc-800/80 font-mono text-xs overflow-x-auto text-zinc-200">
              <pre>{JSON.stringify(result || { error }, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
