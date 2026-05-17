import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy,
  Loader2,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Zap,
  Target,
  PenSquare,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { api } from '../utils/api';

export default function CompetitorCloning() {
  const navigate = useNavigate();
  const [sourceText, setSourceText] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleAnalyze() {
    if (!sourceText.trim() && !sourceUrl.trim()) {
      setError('Paste a competitor post or enter a URL');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await api.analyzeCompetitor({
        text: sourceText.trim(),
        url: sourceUrl.trim() || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Analysis failed');
    }
    setLoading(false);
  }

  function handleUsePost() {
    if (result?.generated_post) {
      const params = new URLSearchParams({ prefill: result.generated_post });
      navigate(`/compose?${params.toString()}`);
    }
  }

  function handleReset() {
    setSourceText('');
    setSourceUrl('');
    setResult(null);
    setError('');
  }

  const ENGAGEMENT_COLORS = {
    high: 'text-green-400 bg-green-500/20',
    medium: 'text-yellow-400 bg-yellow-500/20',
    low: 'text-red-400 bg-red-500/20',
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Copy className="w-6 h-6 text-violet-400" />
          Competitor Content Cloning
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Analyze competitor posts and generate inspired content for your brand
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Competitor Post</h3>

            <label className="block mb-3">
              <span className="text-xs text-gray-500">Post URL (optional)</span>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://instagram.com/p/..."
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
              />
            </label>

            <label className="block mb-3">
              <span className="text-xs text-gray-500">
                Post Text <span className="text-gray-600">(paste the caption here)</span>
              </span>
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                rows={6}
                placeholder="Paste the competitor's post caption here..."
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-3 text-sm focus:outline-none focus:border-violet-500 resize-none transition-colors"
              />
            </label>

            {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleAnalyze}
                disabled={loading || (!sourceText.trim() && !sourceUrl.trim())}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 rounded-xl text-sm font-semibold text-white transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Analyze & Generate
                  </>
                )}
              </button>
              {result && (
                <button
                  onClick={handleReset}
                  className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Copy className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                Paste a competitor's post to see AI analysis and generate inspired content
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
              <Loader2 className="w-8 h-8 text-violet-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Analyzing competitor content...</p>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Analysis */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-300">Post Analysis</h3>
                  <span className="text-xs text-gray-600">({result.model} mode)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <MessageCircle className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs text-gray-500">Tone</span>
                    </div>
                    <p className="text-sm text-gray-200">{result.analysis.tone}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs text-gray-500">CTA Pattern</span>
                    </div>
                    <p className="text-sm text-gray-200">{result.analysis.cta_pattern}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Zap className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs text-gray-500">Structure</span>
                    </div>
                    <p className="text-sm text-gray-200">{result.analysis.structure}</p>
                  </div>
                  <div className="bg-gray-800/60 rounded-lg p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                      <span className="text-xs text-gray-500">Est. Engagement</span>
                    </div>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-md ${ENGAGEMENT_COLORS[result.analysis.estimated_engagement] || ENGAGEMENT_COLORS.medium}`}>
                      {result.analysis.estimated_engagement}
                    </span>
                  </div>
                </div>

                {result.analysis.hooks?.length > 0 && (
                  <div className="mb-3">
                    <span className="text-xs text-gray-500 block mb-1.5">Hooks Used</span>
                    <div className="space-y-1">
                      {result.analysis.hooks.map((hook, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="text-violet-400 mt-0.5">→</span>
                          {hook}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Generated Post */}
              <div className="bg-gray-900 border border-violet-500/20 rounded-xl p-5">
                <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  Your Inspired Version
                </h3>
                <div className="bg-gray-800/60 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-200 leading-relaxed">{result.generated_post}</p>
                </div>

                {result.tips?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-xs text-gray-500 block mb-2">Tips</span>
                    <div className="space-y-1.5">
                      {result.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                          <span className="text-violet-400 font-bold">{i + 1}.</span>
                          {tip}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUsePost}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-sm font-semibold text-white transition-all"
                >
                  <PenSquare className="w-4 h-4" />
                  Open in Composer
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
