import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  X,
  Mail,
  Archive,
  Tag,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Hash,
  Globe,
  AlertCircle,
  MessageCircle,
  BarChart3,
} from 'lucide-react';
import { api, PLATFORM_MAP } from '../utils/api';

const SENTIMENT_CONFIG = {
  positive: { label: 'Positive', color: 'text-green-400', bg: 'bg-green-500/20', dot: 'bg-green-400', icon: TrendingUp },
  neutral: { label: 'Neutral', color: 'text-gray-400', bg: 'bg-gray-500/20', dot: 'bg-gray-400', icon: Minus },
  negative: { label: 'Negative', color: 'text-red-400', bg: 'bg-red-500/20', dot: 'bg-red-400', icon: TrendingDown },
};

const KEYWORD_TYPES = [
  { id: 'keyword', label: 'Keyword', icon: Search },
  { id: 'hashtag', label: 'Hashtag', icon: Hash },
  { id: 'brand', label: 'Brand', icon: Globe },
  { id: 'competitor', label: 'Competitor', icon: AlertCircle },
];

export default function Monitoring() {
  const [tab, setTab] = useState('inbox');
  const [mentions, setMentions] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMention, setSelectedMention] = useState(null);
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordType, setNewKeywordType] = useState('keyword');
  const [showAddKeyword, setShowAddKeyword] = useState(false);

  useEffect(() => {
    loadData();
  }, [tab, sentimentFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params = {};
      if (sentimentFilter) params.sentiment = sentimentFilter;

      const [mentionsRes, keywordsRes, statsRes] = await Promise.allSettled([
        api.getMentions(params),
        api.getMonitoringKeywords(),
        api.getMonitoringStats(),
      ]);

      if (mentionsRes.status === 'fulfilled') setMentions(mentionsRes.value.mentions || []);
      if (keywordsRes.status === 'fulfilled') setKeywords(keywordsRes.value.keywords || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.stats || null);
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function handleAddKeyword() {
    if (!newKeyword.trim()) return;
    try {
      await api.addMonitoringKeyword({ keyword: newKeyword.trim(), type: newKeywordType });
      setNewKeyword('');
      setShowAddKeyword(false);
      loadData();
    } catch (err) {
      console.error('Add keyword failed:', err);
    }
  }

  async function handleDeleteKeyword(id) {
    try {
      await api.deleteMonitoringKeyword(id);
      loadData();
    } catch (err) {
      console.error('Delete keyword failed:', err);
    }
  }

  async function handleMarkRead(id) {
    try {
      await api.updateMention(id, { is_read: true });
      setMentions((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    } catch (err) {
      console.error('Mark read failed:', err);
    }
  }

  async function handleArchive(id) {
    try {
      await api.updateMention(id, { is_archived: true });
      setMentions((prev) => prev.filter((m) => m.id !== id));
      if (selectedMention?.id === id) setSelectedMention(null);
    } catch (err) {
      console.error('Archive failed:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Social Listening</h2>
          <p className="text-sm text-gray-400 mt-1">Monitor brand mentions, keywords, and sentiment</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-800 pb-3">
        {[
          { id: 'inbox', label: 'Inbox', icon: MessageCircle, count: stats?.unread },
          { id: 'keywords', label: 'Keywords', icon: Hash, count: keywords.length },
          { id: 'overview', label: 'Overview', icon: BarChart3 },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-xs">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'inbox' && (
        <div className="space-y-4">
          {/* Sentiment filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <button
              onClick={() => setSentimentFilter('')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !sentimentFilter ? 'bg-gray-700 text-gray-200' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              All
            </button>
            {Object.entries(SENTIMENT_CONFIG).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => setSentimentFilter(key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  sentimentFilter === key ? `${cfg.bg} ${cfg.color}` : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Two-column inbox */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 min-h-[400px]">
            {/* Mention list (left) */}
            <div className="lg:col-span-2 space-y-2 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : mentions.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No mentions found</p>
                </div>
              ) : (
                mentions.map((mention) => {
                  const sentCfg = SENTIMENT_CONFIG[mention.sentiment] || SENTIMENT_CONFIG.neutral;
                  const platCfg = PLATFORM_MAP[mention.platform];
                  return (
                    <button
                      key={mention.id}
                      onClick={() => { setSelectedMention(mention); handleMarkRead(mention.id); }}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedMention?.id === mention.id
                          ? 'border-purple-500/50 bg-gray-800'
                          : 'border-gray-800 bg-gray-900 hover:bg-gray-800/50'
                      } ${!mention.is_read ? 'border-l-2 border-l-purple-400' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                          {mention.author_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-200 truncate block">
                            {mention.author_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {mention.author_handle ? `@${mention.author_handle}` : ''} on {platCfg?.label || mention.platform}
                          </span>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${sentCfg.dot}`} title={sentCfg.label} />
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{mention.content}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(mention.created_at).toLocaleString()}
                      </p>
                    </button>
                  );
                })
              )}
            </div>

            {/* Mention detail (right) */}
            <div className="lg:col-span-3">
              {selectedMention ? (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-300">
                        {selectedMention.author_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-100">{selectedMention.author_name}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedMention.author_handle ? `@${selectedMention.author_handle}` : ''} on{' '}
                          {PLATFORM_MAP[selectedMention.platform]?.label || selectedMention.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const cfg = SENTIMENT_CONFIG[selectedMention.sentiment] || SENTIMENT_CONFIG.neutral;
                        const SentIcon = cfg.icon;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                            <SentIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="text-gray-200 text-sm leading-relaxed">{selectedMention.content}</p>
                  </div>

                  {selectedMention.matched_keyword && (
                    <p className="text-xs text-gray-500 mb-3">
                      Matched keyword: <span className="text-purple-400">{selectedMention.matched_keyword}</span>
                    </p>
                  )}

                  {selectedMention.source_url && (
                    <a
                      href={selectedMention.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-400 hover:text-purple-300 underline mb-4 block"
                    >
                      View original post
                    </a>
                  )}

                  {/* Tags */}
                  <div className="flex items-center gap-2 mb-4">
                    <Tag className="w-4 h-4 text-gray-500" />
                    {selectedMention.tags?.length > 0 ? (
                      selectedMention.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 text-xs">
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-600">No tags</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-gray-800 pt-4">
                    <button
                      onClick={() => handleArchive(selectedMention.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archive
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-xl border border-gray-800 flex items-center justify-center h-full min-h-[300px]">
                  <div className="text-center">
                    <Mail className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Select a mention to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'keywords' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">Track keywords, hashtags, brands, and competitors</p>
            <button
              onClick={() => setShowAddKeyword(!showAddKeyword)}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Keyword
            </button>
          </div>

          {/* Add keyword form */}
          {showAddKeyword && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-gray-400 mb-1 block">Keyword or phrase</label>
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="e.g. PostFlow, #socialmedia"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1 block">Type</label>
                <select
                  value={newKeywordType}
                  onChange={(e) => setNewKeywordType(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {KEYWORD_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddKeyword}
                disabled={!newKeyword.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                Add
              </button>
            </div>
          )}

          {/* Keywords list */}
          {keywords.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-10 h-10 text-gray-700 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No keywords being monitored</p>
              <p className="text-gray-600 text-xs mt-1">Add keywords to start tracking mentions</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {keywords.map((kw) => {
                const typeCfg = KEYWORD_TYPES.find((t) => t.id === kw.type) || KEYWORD_TYPES[0];
                const TypeIcon = typeCfg.icon;
                return (
                  <div key={kw.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <TypeIcon className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-200 truncate">{kw.keyword}</p>
                      <p className="text-xs text-gray-500 capitalize">{kw.type}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteKeyword(kw.id)}
                      className="p-1 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Mentions', value: stats?.total || 0, color: 'text-gray-100' },
              { label: 'Unread', value: stats?.unread || 0, color: 'text-purple-400' },
              { label: 'Positive', value: stats?.positive || 0, color: 'text-green-400' },
              { label: 'Neutral', value: stats?.neutral || 0, color: 'text-gray-400' },
              { label: 'Negative', value: stats?.negative || 0, color: 'text-red-400' },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Sentiment breakdown bar */}
          {stats && stats.total > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Sentiment Breakdown</h3>
              <div className="flex h-4 rounded-full overflow-hidden bg-gray-800">
                {stats.positive > 0 && (
                  <div
                    className="bg-green-500 transition-all"
                    style={{ width: `${(stats.positive / stats.total) * 100}%` }}
                    title={`Positive: ${stats.positive}`}
                  />
                )}
                {stats.neutral > 0 && (
                  <div
                    className="bg-gray-500 transition-all"
                    style={{ width: `${(stats.neutral / stats.total) * 100}%` }}
                    title={`Neutral: ${stats.neutral}`}
                  />
                )}
                {stats.negative > 0 && (
                  <div
                    className="bg-red-500 transition-all"
                    style={{ width: `${(stats.negative / stats.total) * 100}%` }}
                    title={`Negative: ${stats.negative}`}
                  />
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> Positive ({Math.round((stats.positive / stats.total) * 100)}%)
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-gray-500" /> Neutral ({Math.round((stats.neutral / stats.total) * 100)}%)
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> Negative ({Math.round((stats.negative / stats.total) * 100)}%)
                </span>
              </div>
            </div>
          )}

          {/* By platform */}
          {stats?.by_platform && Object.keys(stats.by_platform).length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Mentions by Platform</h3>
              <div className="space-y-2">
                {Object.entries(stats.by_platform)
                  .sort((a, b) => b[1] - a[1])
                  .map(([platform, count]) => {
                    const cfg = PLATFORM_MAP[platform];
                    return (
                      <div key={platform} className="flex items-center gap-3">
                        <span className="text-sm text-gray-300 w-24">{cfg?.label || platform}</span>
                        <div className="flex-1 h-3 rounded-full bg-gray-800 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(count / stats.total) * 100}%`,
                              backgroundColor: cfg?.color || '#6b7280',
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
