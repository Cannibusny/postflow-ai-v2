import React, { useState, useEffect, useRef } from 'react';
import { Hash, Loader2, TrendingUp, Sparkles } from 'lucide-react';
import { api } from '../utils/api';

const POPULARITY_CONFIG = {
  high: { color: 'text-green-400', dot: 'bg-green-400', label: 'Popular' },
  medium: { color: 'text-yellow-400', dot: 'bg-yellow-400', label: 'Growing' },
  low: { color: 'text-gray-400', dot: 'bg-gray-500', label: 'Niche' },
};

export default function HashtagSuggestions({ caption, platforms, existingHashtags, onAddHashtag }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const debounceRef = useRef(null);
  const lastCaptionRef = useRef('');

  useEffect(() => {
    if (!caption || caption.length < 15 || caption === lastCaptionRef.current) return;
    if (dismissed) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(caption);
      lastCaptionRef.current = caption;
    }, 2000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [caption, dismissed]);

  async function fetchSuggestions(text) {
    setLoading(true);
    try {
      const data = await api.suggestHashtags({
        caption: text,
        platforms,
        existing_hashtags: existingHashtags,
      });
      setSuggestions(data.hashtags || []);
      setModel(data.model);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  }

  function handleRefresh() {
    if (caption && caption.length >= 15) {
      setDismissed(false);
      fetchSuggestions(caption);
    }
  }

  if (dismissed && suggestions.length === 0) {
    return (
      <button
        onClick={handleRefresh}
        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 mt-2"
      >
        <Sparkles className="w-3 h-3" />
        Suggest hashtags with AI
      </button>
    );
  }

  if (!loading && suggestions.length === 0) {
    return (
      <button
        onClick={handleRefresh}
        className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 mt-2"
      >
        <Sparkles className="w-3 h-3" />
        Suggest hashtags with AI
      </button>
    );
  }

  return (
    <div className="mt-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium text-gray-400">
            {loading ? 'Finding hashtags...' : 'Suggested Hashtags'}
          </span>
          {model && !loading && (
            <span className="text-xs text-gray-600">
              ({model === 'claude' ? 'AI' : 'auto'})
            </span>
          )}
        </div>
        {!loading && (
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-gray-600 hover:text-gray-400"
          >
            Dismiss
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
          <span className="text-xs text-gray-500">Analyzing your caption...</span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((h) => {
            const pop = POPULARITY_CONFIG[h.popularity] || POPULARITY_CONFIG.medium;
            const alreadyAdded = existingHashtags?.includes(h.tag);
            return (
              <button
                key={h.tag}
                onClick={() => {
                  if (!alreadyAdded) onAddHashtag(h.tag);
                }}
                disabled={alreadyAdded}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  alreadyAdded
                    ? 'bg-purple-500/20 text-purple-300 cursor-default opacity-60'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-purple-500/20 hover:text-purple-300 border border-gray-700 hover:border-purple-500/30'
                }`}
                title={`${h.reach || ''} posts • ${pop.label}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${pop.dot}`} />
                <Hash className="w-3 h-3" />
                {h.tag}
                {h.reach && (
                  <span className="text-gray-500 ml-0.5">{h.reach}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
