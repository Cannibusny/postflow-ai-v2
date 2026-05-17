import React, { useState, useEffect } from 'react';
import { X, Shield, Loader2, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';

const SEVERITY_CONFIG = {
  high: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', badge: 'bg-red-500/20 text-red-400', label: 'High' },
  medium: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', badge: 'bg-yellow-500/20 text-yellow-400', label: 'Medium' },
  low: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', badge: 'bg-blue-500/20 text-blue-400', label: 'Low' },
};

const RISK_CONFIG = {
  none: { color: 'text-green-400', icon: CheckCircle2, label: 'No Issues Found', bg: 'bg-green-500/10' },
  low: { color: 'text-blue-400', icon: AlertTriangle, label: 'Minor Issues', bg: 'bg-blue-500/10' },
  medium: { color: 'text-yellow-400', icon: AlertTriangle, label: 'Needs Attention', bg: 'bg-yellow-500/10' },
  high: { color: 'text-red-400', icon: AlertTriangle, label: 'Compliance Risk', bg: 'bg-red-500/10' },
};

export default function ComplianceModal({ onClose, caption, onEdit, onOverride }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    runCheck();
  }, []);

  async function runCheck() {
    setLoading(true);
    try {
      const data = await api.complianceCheck({ caption });
      setResult(data);
    } catch {
      const violations = [];
      if (/\b(cure[sd]?|treat[s]?|heal[s]?|medical benefit)\b/i.test(caption)) {
        violations.push({
          category: 'Health Claims',
          severity: 'high',
          message: 'Cannot make health or medical claims about cannabis products',
          suggestion: 'Remove health claims. Focus on experience, flavor, or effects.',
        });
      }
      if (/\b(kids?|children|minors?|teens?|all ages)\b/i.test(caption)) {
        violations.push({
          category: 'Appeal to Minors',
          severity: 'high',
          message: 'Content may appeal to minors',
          suggestion: 'Ensure content targets adults only.',
        });
      }
      if (!/\b(21\+|adults?\s*only|must\s*be\s*21)\b/i.test(caption) && caption.length > 20) {
        violations.push({
          category: 'Missing Age Disclaimer',
          severity: 'low',
          message: 'No 21+ age disclaimer detected',
          suggestion: 'Add "21+ only" to your post.',
        });
      }
      const riskLevel = violations.some((v) => v.severity === 'high')
        ? 'high'
        : violations.some((v) => v.severity === 'medium')
        ? 'medium'
        : violations.length > 0
        ? 'low'
        : 'none';
      setResult({ violations, risk_level: riskLevel, total_violations: violations.length, model: 'rules-engine' });
    }
    setLoading(false);
  }

  const risk = result ? RISK_CONFIG[result.risk_level] || RISK_CONFIG.none : null;
  const RiskIcon = risk?.icon || CheckCircle2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-red-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Compliance Check</h3>
              <p className="text-xs text-gray-500">Cannabis advertising compliance scanner</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm text-gray-400">Scanning for compliance issues...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Risk Level Badge */}
              <div className={`flex items-center gap-3 p-4 rounded-xl border ${risk?.bg} border-gray-700`}>
                <RiskIcon className={`w-6 h-6 ${risk?.color}`} />
                <div>
                  <p className={`text-sm font-semibold ${risk?.color}`}>{risk?.label}</p>
                  <p className="text-xs text-gray-400">
                    {result.total_violations === 0
                      ? 'Your post looks compliant!'
                      : `${result.total_violations} issue${result.total_violations > 1 ? 's' : ''} found`}
                  </p>
                </div>
                {result.model && (
                  <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
                    {result.model === 'claude' ? '🤖 AI' : '📋 Rules'}
                  </span>
                )}
              </div>

              {/* Violations List */}
              {result.violations.length > 0 && (
                <div className="space-y-3">
                  {result.violations.map((v, idx) => {
                    const sev = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG.low;
                    return (
                      <div key={idx} className={`p-4 rounded-xl border ${sev.bg}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className={`w-4 h-4 ${sev.color}`} />
                          <span className="text-sm font-medium text-gray-200">{v.category}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sev.badge}`}>
                            {sev.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{v.message}</p>
                        {v.suggestion && (
                          <div className="flex items-start gap-2 mt-2 p-2 bg-gray-800/50 rounded-lg">
                            <ChevronRight className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-gray-400">{v.suggestion}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && result && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-800">
            {result.violations.length > 0 ? (
              <>
                <button
                  onClick={() => {
                    onEdit();
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Post
                </button>
                <button
                  onClick={() => {
                    onOverride();
                    onClose();
                  }}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 rounded-lg text-sm font-medium transition-colors"
                >
                  Acknowledge & Schedule
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  onOverride();
                  onClose();
                }}
                className="px-5 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
              >
                Looks Good — Schedule
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
