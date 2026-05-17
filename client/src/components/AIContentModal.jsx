import React, { useState } from 'react';
import { X, Sparkles, Loader2, Zap, BookOpen, MessageCircle } from 'lucide-react';
import { api } from '../utils/api';

const TONE_ICONS = {
  Enthusiastic: Zap,
  Educational: BookOpen,
  Conversational: MessageCircle,
};

const TONE_COLORS = {
  Enthusiastic: 'border-orange-500/40 bg-orange-500/10',
  Educational: 'border-blue-500/40 bg-blue-500/10',
  Conversational: 'border-green-500/40 bg-green-500/10',
};

export default function AIContentModal({ onClose, onSelect, platforms }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [variations, setVariations] = useState(null);
  const [selected, setSelected] = useState(null);
  const [model, setModel] = useState(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setLoading(true);
    setVariations(null);
    setSelected(null);
    try {
      const data = await api.generateContent({ prompt, platforms });
      setVariations(data.variations);
      setModel(data.model);
    } catch {
      setVariations([
        { tone: 'Enthusiastic', text: `🔥 ${prompt}! We're SO excited to share this — drop a 🙌 if you're pumped!` },
        { tone: 'Educational', text: `📚 Did you know? ${prompt} — here's what makes it special and why it matters.` },
        { tone: 'Conversational', text: `Hey friends 👋 Let's talk about ${prompt}. What do you think? Tell us below!` },
      ]);
      setModel('demo');
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Content Generator</h3>
              <p className="text-xs text-gray-500">Describe your post idea — AI writes 3 variations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Prompt Input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What should this post be about?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder='e.g. "Promote our new Midnight Roast coffee, emphasize smooth taste and local sourcing"'
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 resize-none transition-colors"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Variations
                </>
              )}
            </button>
          </div>

          {/* Variations */}
          {variations && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-300">Pick a variation</span>
                {model && (
                  <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                    {model === 'demo' ? '✨ Demo Mode' : '🤖 AI Generated'}
                  </span>
                )}
              </div>
              {variations.map((v, idx) => {
                const Icon = TONE_ICONS[v.tone] || Sparkles;
                const colorClass = TONE_COLORS[v.tone] || 'border-gray-700 bg-gray-800/50';
                const isSelected = selected === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelected(idx)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30'
                        : `${colorClass} hover:border-gray-600`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        {v.tone}
                      </span>
                      <span className="text-xs text-gray-600">{v.text.length} chars</span>
                    </div>
                    <p className="text-sm text-gray-200 leading-relaxed">{v.text}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {variations && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={() => {
                if (selected !== null && variations[selected]) {
                  onSelect(variations[selected].text);
                  onClose();
                }
              }}
              disabled={selected === null}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              Use This Caption
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
