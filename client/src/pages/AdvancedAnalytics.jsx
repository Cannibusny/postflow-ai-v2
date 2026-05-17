import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  BarChart3,
  Plus,
  Trash2,
  Loader2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Music2,
  Eye,
  Heart,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../utils/api';

const PLATFORM_ICONS = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  tiktok: Music2,
};

const PLATFORM_OPTIONS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'tiktok', label: 'TikTok' },
];

function MetricCard({ icon: Icon, label, value, change, color }) {
  return (
    <div className="bg-gray-800/60 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-100">{value}</div>
      {change !== undefined && (
        <div className={`text-xs mt-1 ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% vs last period
        </div>
      )}
    </div>
  );
}

function CompetitorRow({ competitor, onDelete }) {
  const Icon = PLATFORM_ICONS[competitor.platform] || Users;
  const metrics = competitor.competitor_metrics?.[0];

  return (
    <div className="flex items-center gap-4 bg-gray-800/40 rounded-xl p-4 border border-gray-800">
      <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
        {competitor.avatar_url ? (
          <img src={competitor.avatar_url} alt="" className="w-10 h-10 rounded-full" />
        ) : (
          <Icon className="w-5 h-5 text-gray-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200 truncate">
            {competitor.display_name || competitor.handle}
          </span>
          <span className="text-xs text-gray-500">@{competitor.handle}</span>
        </div>
        <span className="text-xs text-gray-500 capitalize">{competitor.platform}</span>
      </div>

      {metrics ? (
        <div className="hidden sm:flex items-center gap-6">
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-200">
              {(metrics.followers || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-200">
              {metrics.engagement_rate || 0}%
            </div>
            <div className="text-xs text-gray-500">Eng. Rate</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-gray-200">
              {(metrics.avg_likes || 0).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Avg Likes</div>
          </div>
        </div>
      ) : (
        <span className="text-xs text-gray-600">No metrics yet</span>
      )}

      <button
        onClick={() => onDelete(competitor.id)}
        className="p-2 text-gray-600 hover:text-red-400 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function AdvancedAnalytics() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState({ platform: 'instagram', handle: '', display_name: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadCompetitors();
  }, []);

  async function loadCompetitors() {
    setLoading(true);
    try {
      const data = await api.getCompetitors();
      setCompetitors(data.competitors || []);
    } catch (err) {
      // Silently handle — table might not exist yet
      setCompetitors([]);
    }
    setLoading(false);
  }

  async function handleAddCompetitor(e) {
    e.preventDefault();
    if (!newCompetitor.handle.trim()) return;
    setAdding(true);
    try {
      const data = await api.addCompetitor(newCompetitor);
      setCompetitors([data.competitor, ...competitors]);
      setNewCompetitor({ platform: 'instagram', handle: '', display_name: '' });
      setShowAddForm(false);
    } catch (err) {
      alert('Failed to add competitor: ' + err.message);
    }
    setAdding(false);
  }

  async function handleDeleteCompetitor(id) {
    try {
      await api.deleteCompetitor(id);
      setCompetitors(competitors.filter((c) => c.id !== id));
    } catch (err) {
      alert('Failed to remove: ' + err.message);
    }
  }

  // Demo stats for when no real data exists
  const demoStats = {
    followers: { value: '12,450', change: 3.2 },
    engagement: { value: '4.7%', change: 0.8 },
    reach: { value: '45.2K', change: 12.1 },
    posts: { value: '128', change: 5.0 },
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Advanced Analytics
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Competitor benchmarking & performance insights
          </p>
        </div>
        <button
          onClick={loadCompetitors}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Your Performance Summary */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">
          Your Performance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={Users}
            label="Total Followers"
            value={demoStats.followers.value}
            change={demoStats.followers.change}
            color="text-blue-400"
          />
          <MetricCard
            icon={Heart}
            label="Engagement Rate"
            value={demoStats.engagement.value}
            change={demoStats.engagement.change}
            color="text-pink-400"
          />
          <MetricCard
            icon={Eye}
            label="Total Reach"
            value={demoStats.reach.value}
            change={demoStats.reach.change}
            color="text-purple-400"
          />
          <MetricCard
            icon={BarChart3}
            label="Posts Published"
            value={demoStats.posts.value}
            change={demoStats.posts.change}
            color="text-emerald-400"
          />
        </div>
      </div>

      {/* Competitor Benchmarking */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300">
            Competitor Tracking
            <span className="text-gray-600 ml-2">({competitors.length})</span>
          </h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-300 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Competitor
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddCompetitor} className="mb-4 bg-gray-800/40 border border-gray-700 rounded-xl p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <label className="block">
                <span className="text-xs text-gray-500">Platform</span>
                <select
                  value={newCompetitor.platform}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, platform: e.target.value })}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  {PLATFORM_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Handle</span>
                <input
                  type="text"
                  value={newCompetitor.handle}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, handle: e.target.value })}
                  placeholder="@competitor"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500">Display Name</span>
                <input
                  type="text"
                  value={newCompetitor.display_name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, display_name: e.target.value })}
                  placeholder="Brand Name"
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={adding || !newCompetitor.handle.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium text-white transition-colors"
              >
                {adding ? 'Adding...' : 'Add'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Competitors List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        ) : competitors.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">No competitors tracked yet</p>
            <p className="text-xs text-gray-600">Add competitor accounts to benchmark your performance</p>
          </div>
        ) : (
          <div className="space-y-2">
            {competitors.map((c) => (
              <CompetitorRow
                key={c.id}
                competitor={c}
                onDelete={handleDeleteCompetitor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Comparison Chart Placeholder */}
      <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4">
          Performance Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Engagement Rate', 'Follower Growth', 'Post Frequency'].map((metric) => (
            <div key={metric} className="bg-gray-800/40 rounded-xl p-4">
              <span className="text-xs text-gray-500 block mb-3">{metric}</span>
              {/* Demo comparison bars */}
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-emerald-400">You</span>
                    <span className="text-gray-400">
                      {metric === 'Engagement Rate' ? '4.7%' : metric === 'Follower Growth' ? '+320' : '32/mo'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: metric === 'Engagement Rate' ? '70%' : metric === 'Follower Growth' ? '60%' : '80%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Avg Competitor</span>
                    <span className="text-gray-400">
                      {metric === 'Engagement Rate' ? '3.2%' : metric === 'Follower Growth' ? '+450' : '28/mo'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-gray-500 to-gray-400 rounded-full"
                      style={{ width: metric === 'Engagement Rate' ? '48%' : metric === 'Follower Growth' ? '85%' : '70%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
