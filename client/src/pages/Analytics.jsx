import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Area,
  AreaChart,
} from 'recharts';
import {
  Eye,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { usePosts } from '../hooks/usePosts';
import { PlatformBadgeRow } from '../components/PlatformBadge';
import { format, subDays, isAfter } from 'date-fns';

const DATE_RANGES = [
  { key: '7', label: 'Last 7 Days', days: 7 },
  { key: '30', label: 'Last 30 Days', days: 30 },
  { key: '90', label: 'Last 90 Days', days: 90 },
];

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const tooltipStyle = {
  backgroundColor: '#1F2937',
  border: '1px solid #374151',
  borderRadius: '8px',
  fontSize: '12px',
};

export default function Analytics() {
  const { posts, loading } = usePosts();
  const [dateRange, setDateRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');
  const [sortBy, setSortBy] = useState('likes');
  const [sortDir, setSortDir] = useState('desc');

  const rangeDays = DATE_RANGES.find((r) => r.key === dateRange)?.days || 30;
  const cutoff = subDays(new Date(), rangeDays);

  const filteredPosts = useMemo(() => {
    return posts.filter(
      (p) => p.status === 'posted' && p.posted_at && isAfter(new Date(p.posted_at), cutoff)
    );
  }, [posts, cutoff]);

  const postedPosts = filteredPosts.filter((p) => p.actual_engagement);

  const totals = useMemo(() => {
    return postedPosts.reduce(
      (acc, p) => {
        const e = p.actual_engagement || {};
        acc.reach += e.reach || 0;
        acc.likes += e.likes || 0;
        acc.comments += e.comments || 0;
        acc.saves += e.saves || 0;
        acc.shares += e.shares || 0;
        acc.impressions += e.impressions || 0;
        return acc;
      },
      { reach: 0, likes: 0, comments: 0, saves: 0, shares: 0, impressions: 0 }
    );
  }, [postedPosts]);

  const engagementRate = useMemo(() => {
    if (totals.reach === 0) return 0;
    return (
      ((totals.likes + totals.comments + totals.shares + totals.saves) / totals.reach) *
      100
    ).toFixed(1);
  }, [totals]);

  const statCards = [
    { label: 'Total Impressions', value: totals.impressions, icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/10', trend: '+12%' },
    { label: 'Engagement Rate', value: engagementRate + '%', icon: TrendingUp, color: 'text-green-400', bgColor: 'bg-green-500/10', trend: '+3.2%' },
    { label: 'Total Likes', value: totals.likes, icon: Heart, color: 'text-red-400', bgColor: 'bg-red-500/10', trend: '+8%' },
    { label: 'Comments', value: totals.comments, icon: MessageCircle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', trend: '+5%' },
  ];

  // Engagement over time line chart data
  const engagementOverTime = useMemo(() => {
    const byDate = {};
    for (const p of postedPosts) {
      const key = format(new Date(p.posted_at), 'MMM d');
      const e = p.actual_engagement || {};
      if (!byDate[key]) byDate[key] = { date: key, engagement: 0, reach: 0, posts: 0 };
      byDate[key].engagement += (e.likes || 0) + (e.comments || 0) + (e.shares || 0);
      byDate[key].reach += e.reach || 0;
      byDate[key].posts += 1;
    }
    return Object.values(byDate);
  }, [postedPosts]);

  // Predicted vs Actual bar chart
  const comparisonData = useMemo(() => {
    return filteredPosts.slice(0, 15).map((p) => ({
      name: p.title.length > 15 ? p.title.slice(0, 15) + '...' : p.title,
      predicted: p.engagement_prediction || 0,
      actual: p.actual_engagement
        ? Math.round(
            ((p.actual_engagement.likes || 0) +
              (p.actual_engagement.comments || 0) +
              (p.actual_engagement.shares || 0) +
              (p.actual_engagement.saves || 0)) /
              Math.max(p.actual_engagement.reach || 1, 1) *
              100
          )
        : 0,
    }));
  }, [filteredPosts]);

  // Best time to post heatmap data
  const heatmapData = useMemo(() => {
    const grid = {};
    for (const day of DAYS_OF_WEEK) {
      grid[day] = {};
      for (const h of HOURS) grid[day][h] = 0;
    }
    for (const p of postedPosts) {
      const d = new Date(p.posted_at);
      const dayName = DAYS_OF_WEEK[d.getDay()];
      const hour = d.getHours();
      const e = p.actual_engagement || {};
      grid[dayName][hour] += (e.likes || 0) + (e.comments || 0) + (e.shares || 0);
    }
    return grid;
  }, [postedPosts]);

  const maxHeatVal = useMemo(() => {
    let max = 0;
    for (const day of DAYS_OF_WEEK) {
      for (const h of HOURS) {
        if (heatmapData[day]?.[h] > max) max = heatmapData[day][h];
      }
    }
    return max || 1;
  }, [heatmapData]);

  // Sort posts for table
  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      const ae = a.actual_engagement || {};
      const be = b.actual_engagement || {};
      const av = ae[sortBy] || 0;
      const bv = be[sortBy] || 0;
      return sortDir === 'desc' ? bv - av : av - bv;
    });
  }, [filteredPosts, sortBy, sortDir]);

  function handleSort(col) {
    if (sortBy === col) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  }

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'posts', label: 'Post Performance' },
    { key: 'best-times', label: 'Best Times' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold">Analytics</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex bg-gray-800 rounded-lg p-0.5">
            {DATE_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setDateRange(key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  dateRange === key
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-800/50 rounded-lg p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === key
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map(({ label, value, icon: Icon, color, bgColor, trend }) => (
                  <div
                    key={label}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-lg ${bgColor}`}>
                        <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <span className="text-xs text-green-400 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        {trend}
                      </span>
                    </div>
                    <div className="text-2xl font-bold">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{label}</div>
                  </div>
                ))}
              </div>

              {/* Engagement Over Time */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Engagement Over Time</h3>
                {engagementOverTime.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={engagementOverTime}>
                      <defs>
                        <linearGradient id="engGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                      <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Area
                        type="monotone"
                        dataKey="engagement"
                        stroke="#8B5CF6"
                        fill="url(#engGradient)"
                        strokeWidth={2}
                        name="Engagement"
                      />
                      <Area
                        type="monotone"
                        dataKey="reach"
                        stroke="#06B6D4"
                        fill="transparent"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        name="Reach"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No engagement data yet. Analytics appear after posts are published.
                  </div>
                )}
              </div>

              {/* Predicted vs Actual */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Predicted vs Actual Engagement</h3>
                {comparisonData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                      <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} angle={-20} />
                      <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Bar dataKey="predicted" fill="#8B5CF6" name="Predicted %" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="actual" fill="#10B981" name="Actual %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No data yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post Performance Tab */}
          {activeTab === 'posts' && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Post</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Platform</th>
                      <th className="text-left px-4 py-3 text-gray-400 font-medium">Published</th>
                      {['reach', 'impressions', 'likes', 'comments', 'shares', 'saves'].map((col) => (
                        <th
                          key={col}
                          onClick={() => handleSort(col)}
                          className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200 transition-colors capitalize"
                        >
                          {col}
                          {sortBy === col && (
                            <span className="ml-1">{sortDir === 'desc' ? '↓' : '↑'}</span>
                          )}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPosts.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-8 text-gray-500">
                          No posted content in this date range.
                        </td>
                      </tr>
                    ) : (
                      sortedPosts.map((post) => {
                        const e = post.actual_engagement || {};
                        return (
                          <tr
                            key={post.id}
                            className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <Link
                                to={`/posts/${post.id}`}
                                className="flex items-center gap-2 hover:text-purple-400 transition-colors"
                              >
                                <span className="text-lg">{post.image_emoji || '📸'}</span>
                                <span className="truncate max-w-[200px]">{post.title}</span>
                              </Link>
                            </td>
                            <td className="px-4 py-3">
                              <PlatformBadgeRow platforms={post.platforms || ['instagram']} />
                            </td>
                            <td className="px-4 py-3 text-gray-400 text-xs">
                              {post.posted_at
                                ? format(new Date(post.posted_at), 'MMM d, h:mm a')
                                : '-'}
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {(e.reach || 0).toLocaleString()}
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {(e.impressions || 0).toLocaleString()}
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {(e.likes || 0).toLocaleString()}
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {(e.comments || 0).toLocaleString()}
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {(e.shares || 0).toLocaleString()}
                            </td>
                            <td className="text-right px-4 py-3 text-gray-300">
                              {(e.saves || 0).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Best Times Tab */}
          {activeTab === 'best-times' && (
            <div className="space-y-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Best Time to Post</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Engagement heatmap — brighter cells indicate higher engagement at that time
                </p>
                <div className="overflow-x-auto">
                  <div className="min-w-[700px]">
                    {/* Hour headers */}
                    <div className="flex items-center mb-1">
                      <div className="w-12 shrink-0" />
                      {HOURS.filter((h) => h % 2 === 0).map((h) => (
                        <div
                          key={h}
                          className="text-xs text-gray-500 text-center"
                          style={{ width: `${100 / 12}%` }}
                        >
                          {h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`}
                        </div>
                      ))}
                    </div>
                    {/* Grid rows */}
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="flex items-center mb-0.5">
                        <div className="w-12 shrink-0 text-xs text-gray-400 pr-2 text-right">
                          {day}
                        </div>
                        <div className="flex-1 flex gap-0.5">
                          {HOURS.map((h) => {
                            const val = heatmapData[day]?.[h] || 0;
                            const intensity = val / maxHeatVal;
                            return (
                              <div
                                key={h}
                                className="flex-1 h-8 rounded-sm transition-colors"
                                style={{
                                  backgroundColor:
                                    val === 0
                                      ? '#1F2937'
                                      : `rgba(139, 92, 246, ${0.15 + intensity * 0.85})`,
                                }}
                                title={`${day} ${h}:00 — ${val} engagements`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {/* Legend */}
                    <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
                      <span>Less</span>
                      <div className="flex gap-0.5">
                        {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
                          <div
                            key={v}
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: `rgba(139, 92, 246, ${v})` }}
                          />
                        ))}
                      </div>
                      <span>More</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performing Posts */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Posts</h3>
                {postedPosts.length > 0 ? (
                  <div className="space-y-3">
                    {postedPosts
                      .sort(
                        (a, b) =>
                          (b.actual_engagement?.likes || 0) - (a.actual_engagement?.likes || 0)
                      )
                      .slice(0, 5)
                      .map((post, idx) => (
                        <Link
                          key={post.id}
                          to={`/posts/${post.id}`}
                          className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-gray-600 w-6">#{idx + 1}</span>
                            <span className="text-xl">{post.image_emoji}</span>
                            <div>
                              <span className="text-sm font-medium block">{post.title}</span>
                              <span className="text-xs text-gray-500">
                                {post.posted_at && format(new Date(post.posted_at), 'MMM d')}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-red-400" />
                              {(post.actual_engagement?.likes || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-yellow-400" />
                              {(post.actual_engagement?.comments || 0).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Bookmark className="w-3.5 h-3.5 text-green-400" />
                              {(post.actual_engagement?.saves || 0).toLocaleString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No posted content yet.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
