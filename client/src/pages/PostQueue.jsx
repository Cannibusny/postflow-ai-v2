import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  Play,
  Pause,
  Trash2,
  Plus,
  RefreshCw,
  PenSquare,
} from 'lucide-react';
import { usePosts } from '../hooks/usePosts';
import { api } from '../utils/api';
import { PlatformBadgeRow } from '../components/PlatformBadge';
import CreatePostModal from '../components/CreatePostModal';

const STATUS_CONFIG = {
  draft: { icon: FileEdit, color: 'text-gray-400', bg: 'bg-gray-800', label: 'Draft' },
  scheduled: { icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/20', label: 'Scheduled' },
  posted: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Posted' },
  failed: { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/20', label: 'Failed' },
};

export default function PostQueue() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('');
  const { posts, loading, error, refetch } = usePosts(filter ? { status: filter } : {});
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const handlePublish = async (id) => {
    if (!confirm('Publish this post immediately?')) return;
    setActionLoading(id);
    try {
      await api.publishPost(id);
      refetch();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const handlePause = async (id) => {
    setActionLoading(id);
    try {
      await api.pausePost(id);
      refetch();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this post permanently?')) return;
    setActionLoading(id);
    try {
      await api.deletePost(id);
      refetch();
    } catch (err) {
      alert(err.message);
    }
    setActionLoading(null);
  };

  const counts = {
    all: posts.length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    posted: posts.filter((p) => p.status === 'posted').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Post Queue</h2>
          <p className="text-gray-500 text-sm mt-1">{counts.all} posts total</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/compose')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: '', label: 'All', count: counts.all },
          { key: 'scheduled', label: 'Scheduled', count: counts.scheduled },
          { key: 'draft', label: 'Drafts', count: counts.draft },
          { key: 'posted', label: 'Posted', count: counts.posted },
          { key: 'failed', label: 'Failed', count: counts.failed },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 border border-transparent'
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading posts…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No posts found</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const cfg = STATUS_CONFIG[post.status] || STATUS_CONFIG.draft;
            const StatusIcon = cfg.icon;
            const variant = post.caption_variants?.[post.selected_variant || 0];

            return (
              <div
                key={post.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Emoji preview */}
                  <div className="w-16 h-16 rounded-lg bg-gray-800 flex items-center justify-center text-3xl shrink-0">
                    {post.image_emoji || '📸'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/posts/${post.id}`}
                        className="font-semibold hover:text-purple-400 transition-colors truncate"
                      >
                        {post.title}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${cfg.bg} ${cfg.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2">
                      {variant?.caption_text || 'No caption set'}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <PlatformBadgeRow platforms={post.platforms || ['instagram']} />
                      <span>Week {post.week_number}</span>
                      {post.scheduled_date && (
                        <span>
                          {new Date(post.scheduled_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                      <span>
                        Engagement: {post.engagement_prediction}%
                      </span>
                      {post.caption_variants?.length > 0 && (
                        <span>{post.caption_variants.length} variants</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {post.status === 'scheduled' && (
                      <>
                        <button
                          onClick={() => handlePublish(post.id)}
                          disabled={actionLoading === post.id}
                          className="p-2 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                          title="Publish now"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePause(post.id)}
                          disabled={actionLoading === post.id}
                          className="p-2 rounded-lg text-yellow-400 hover:bg-yellow-500/20 transition-colors"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {post.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(post.id)}
                        disabled={actionLoading === post.id}
                        className="p-2 rounded-lg text-green-400 hover:bg-green-500/20 transition-colors"
                        title="Publish now"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      disabled={actionLoading === post.id}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
