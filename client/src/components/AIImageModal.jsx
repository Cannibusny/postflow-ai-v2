import React, { useState } from 'react';
import { X, ImagePlus, Loader2, RefreshCw, Check } from 'lucide-react';
import { api } from '../utils/api';

const DEMO_IMAGES = [
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1504805572947-34fad45aed93?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=512&h=512&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=512&h=512&fit=crop',
];

export default function AIImageModal({ onClose, onSelect }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [model, setModel] = useState(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setImageUrl(null);
    try {
      const data = await api.generateImage({ prompt });
      setImageUrl(data.url);
      setModel(data.model);
    } catch {
      setImageUrl(DEMO_IMAGES[Math.floor(Math.random() * DEMO_IMAGES.length)]);
      setModel('demo');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
              <ImagePlus className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Image Generator</h3>
              <p className="text-xs text-gray-500">Describe the image you want to create</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder='e.g. "Coffee cup on rustic wooden table with morning light, cozy cafe atmosphere"'
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 resize-none transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4" />
                  Generate Image
                </>
              )}
            </button>
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Preview</span>
                {model && (
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                    {model === 'demo' ? '📷 Demo Image' : '🎨 AI Generated'}
                  </span>
                )}
              </div>
              <div className="relative rounded-xl overflow-hidden border border-gray-700">
                <img
                  src={imageUrl}
                  alt="AI Generated"
                  className="w-full h-64 object-cover"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" fill="%23374151"><rect width="512" height="512"/><text x="50%" y="50%" fill="%239CA3AF" font-size="16" text-anchor="middle" dy=".3em">Image preview unavailable</text></svg>';
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {imageUrl && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={() => {
                onSelect(imageUrl);
                onClose();
              }}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Check className="w-4 h-4" />
              Use This Image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
