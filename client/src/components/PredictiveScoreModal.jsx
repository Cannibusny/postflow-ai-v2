import React, { useState, useEffect } from 'react';
import { X, Target, Loader2, TrendingUp, Lightbulb } from 'lucide-react';
import { api } from '../utils/api';

function ScoreGauge({ score }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? '#22c55e' : score >= 50 ? '#eab308' : score >= 25 ? '#f97316' : '#ef4444';

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#1f2937" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {score}
        </span>
        <span className="text-xs text-gray-500">out of 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, max }) {
  const pct = (score / max) * 100;
  const color =
    pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : pct >= 25 ? 'bg-orange-500' : 'bg-red-500';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-400">
          {score}/{max}
        </span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function PredictiveScoreModal({ onClose, caption, hashtags, platforms, scheduledTime }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    runScore();
  }, []);

  async function runScore() {
    setLoading(true);
    try {
      const data = await api.predictScore({
        caption,
        hashtags,
        platforms,
        scheduled_time: scheduledTime,
      });
      setResult(data);
    } catch {
      const captionLen = caption?.length || 0;
      let captionScore = captionLen > 10 && captionLen <= 280 ? 20 : captionLen > 280 ? 15 : 5;
      if (/[!?]/.test(caption)) captionScore += 2;
      if (/[\u{1F600}-\u{1F64F}]/u.test(caption)) captionScore += 3;
      captionScore = Math.min(captionScore, 25);

      const tagCount = hashtags?.length || 0;
      const hashScore = tagCount >= 5 && tagCount <= 15 ? 25 : tagCount > 0 ? 15 : 0;
      const timeScore = 15;
      const platformScore = (platforms?.length || 1) >= 3 ? 25 : (platforms?.length || 1) === 2 ? 20 : 15;
      const total = captionScore + hashScore + timeScore + platformScore;

      const suggestions = [];
      if (captionScore < 20) suggestions.push('Add a question to boost comments and engagement');
      if (hashScore < 20) suggestions.push('Add 5-15 relevant hashtags for better discoverability');
      if (platformScore < 20) suggestions.push('Cross-post to 2-3 platforms to maximize reach');
      suggestions.push('Include a call-to-action (e.g., "Comment below!", "Tag a friend!")');

      setResult({
        score: Math.min(total, 100),
        breakdown: {
          caption: { score: captionScore, max: 25, label: 'Caption Quality' },
          hashtags: { score: hashScore, max: 25, label: 'Hashtag Strategy' },
          timing: { score: timeScore, max: 25, label: 'Posting Time' },
          platforms: { score: platformScore, max: 25, label: 'Platform Reach' },
        },
        suggestions,
        model: 'rules-engine',
      });
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Engagement Prediction</h3>
              <p className="text-xs text-gray-500">AI-powered performance scoring</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-sm text-gray-400">Analyzing your post...</p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Score Gauge */}
              <div className="text-center">
                <ScoreGauge score={result.score} />
                {result.model && (
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                    {result.model === 'claude' ? '🤖 AI Scored' : '📊 Algorithm Scored'}
                  </span>
                )}
              </div>

              {/* Breakdown */}
              {result.breakdown && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-300">Score Breakdown</span>
                  </div>
                  {Object.values(result.breakdown).map((item, idx) => (
                    <BreakdownBar key={idx} label={item.label} score={item.score} max={item.max} />
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {result.suggestions?.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">Suggestions to Improve</span>
                  </div>
                  {result.suggestions.map((s, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                      <span className="text-xs text-gray-500 mt-0.5 shrink-0">{idx + 1}.</span>
                      <p className="text-sm text-gray-300">{s}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
            <button
              onClick={runScore}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Re-analyze
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
            >
              Got It
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
