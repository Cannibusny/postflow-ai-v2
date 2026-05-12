import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Eye, Heart, MessageCircle, Bookmark, Share2, TrendingUp } from 'lucide-react';
import { usePosts } from '../hooks/usePosts';

export default function Analytics() {
  const { posts, loading } = usePosts({ status: 'posted' });

  const postedPosts = posts.filter((p) => p.actual_engagement);

  const chartData = posts.map((p) => ({
    name: p.title.length > 20 ? p.title.slice(0, 20) + '…' : p.title,
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

  const totals = postedPosts.reduce(
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

  const statCards = [
    { label: 'Total Reach', value: totals.reach, icon: Eye, color: 'text-blue-400' },
    { label: 'Total Likes', value: totals.likes, icon: Heart, color: 'text-red-400' },
    { label: 'Comments', value: totals.comments, icon: MessageCircle, color: 'text-yellow-400' },
    { label: 'Saves', value: totals.saves, icon: Bookmark, color: 'text-green-400' },
    { label: 'Shares', value: totals.shares, icon: Share2, color: 'text-purple-400' },
    { label: 'Impressions', value: totals.impressions, icon: TrendingUp, color: 'text-cyan-400' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Analytics</h2>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {statCards.map(({ label, value, icon: Icon, color }) => (
              <div
                key={label}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center"
              >
                <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-1">{label}</div>
              </div>
            ))}
          </div>

          {/* Chart: Predicted vs Actual */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Predicted vs Actual Engagement</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9CA3AF' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="predicted" fill="#8B5CF6" name="Predicted %" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actual" fill="#10B981" name="Actual %" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No engagement data yet. Analytics will appear after posts are published.
              </div>
            )}
          </div>

          {/* Best Performing Posts */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Best Performing Posts</h3>
            {postedPosts.length > 0 ? (
              <div className="space-y-3">
                {postedPosts
                  .sort(
                    (a, b) =>
                      (b.actual_engagement?.likes || 0) - (a.actual_engagement?.likes || 0)
                  )
                  .slice(0, 5)
                  .map((post) => (
                    <div
                      key={post.id}
                      className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{post.image_emoji}</span>
                        <span className="text-sm">{post.title}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>❤️ {post.actual_engagement?.likes || 0}</span>
                        <span>💬 {post.actual_engagement?.comments || 0}</span>
                        <span>📌 {post.actual_engagement?.saves || 0}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No posted content yet. Analytics will populate after posts go live.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
