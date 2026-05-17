import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2, Loader2, RefreshCw, Edit3 } from 'lucide-react';
import { api } from '../utils/api';

const RISK_COLORS = {
  none: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30', label: 'No Risk' },
  low: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Low Risk' },
  medium: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30', label: 'Medium Risk' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'High Risk' },
};

const SEVERITY_ICONS = {
  high: <ShieldAlert className="w-4 h-4 text-red-400" />,
  medium: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  low: <AlertTriangle className="w-4 h-4 text-yellow-400" />,
};

export default function CrisisDetectionModal({ onClose, caption, onEdit, onOverride, onUseReframed }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    runCheck();
  }, []);

  async function runCheck() {
    setLoading(true);
    setError('');
    try {
      const data = await api.crisisCheck({ caption });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Crisis detection failed');
    }
    setLoading(false);
  }

  const riskStyle = result ? RISK_COLORS[result.risk_level] || RISK_COLORS.none : RISK_COLORS.none;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sentiment & Crisis Check</h3>
              <p className="text-xs text-gray-500">AI-powered backlash risk analysis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-orange-400 animate-spin mb-3" />
              <p className="text-sm text-gray-400">Analyzing sentiment and crisis risk...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <button onClick={runCheck} className="text-sm text-orange-400 hover:text-orange-300">
                Retry
              </button>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Risk Badge */}
              <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-4 ${riskStyle.bg} border ${riskStyle.border}`}>
                {result.risk_level === 'none' ? (
                  <CheckCircle2 className={`w-5 h-5 ${riskStyle.text}`} />
                ) : (
                  <ShieldAlert className={`w-5 h-5 ${riskStyle.text}`} />
                )}
                <span className={`text-sm font-semibold ${riskStyle.text}`}>{riskStyle.label}</span>
                {result.sentiment_score !== undefined && (
                  <span className="ml-auto text-xs text-gray-500">
                    Sentiment: {(result.sentiment_score * 100).toFixed(0)}%
                  </span>
                )}
                <span className="text-xs text-gray-600">({result.model})</span>
              </div>

              {/* Issues */}
              {result.issues?.length > 0 && (
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-300">
                    Potential Issues ({result.issues.length})
                  </h4>
                  {result.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-800/60 border border-gray-700 rounded-xl p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {SEVERITY_ICONS[issue.severity] || SEVERITY_ICONS.low}
                        <span className="text-sm font-medium text-gray-200">
                          {issue.category}
                        </span>
                        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                          issue.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                          issue.severity === 'medium' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{issue.message}</p>
                      {issue.reframe && (
                        <div className="bg-gray-900/60 rounded-lg p-2.5 border-l-2 border-orange-500/50">
                          <p className="text-xs text-gray-500 mb-1">Suggested approach:</p>
                          <p className="text-sm text-gray-300">{issue.reframe}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Reframed Text */}
              {result.reframed_text && result.risk_level !== 'none' && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Suggested Rewrite</h4>
                  <div className="bg-gray-800/60 border border-orange-500/20 rounded-xl p-4">
                    <p className="text-sm text-gray-200">{result.reframed_text}</p>
                    <button
                      onClick={() => onUseReframed(result.reframed_text)}
                      className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg text-xs font-medium text-orange-300 transition-all"
                    >
                      <Edit3 className="w-3 h-3" />
                      Use This Version
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 p-5 border-t border-gray-800">
          <button
            onClick={runCheck}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Re-analyze
          </button>
          <div className="flex-1" />
          {result?.risk_level === 'none' ? (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium text-white transition-colors"
            >
              Looks Good — Proceed
            </button>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                Edit Post
              </button>
              <button
                onClick={onOverride}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-medium text-white transition-colors"
              >
                Post Anyway
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
