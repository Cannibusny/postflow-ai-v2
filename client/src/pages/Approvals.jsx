import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  AlertTriangle,
  FileText,
  Eye,
} from 'lucide-react';
import { api, PLATFORM_MAP } from '../utils/api';
import PlatformBadge from '../components/PlatformBadge';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  changes_requested: { label: 'Changes Requested', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: AlertTriangle },
};

export default function Approvals() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState(null);
  const [auditLog, setAuditLog] = useState({});
  const [changeNotes, setChangeNotes] = useState('');
  const [selectedPosts, setSelectedPosts] = useState(new Set());

  useEffect(() => {
    loadPosts();
  }, [filter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const { posts: data } = await api.getPendingApprovals(filter);
      setPosts(data || []);
    } catch {
      setPosts([]);
    }
    setLoading(false);
  }

  async function handleApprove(postId) {
    try {
      await api.approvePost(postId);
      loadPosts();
    } catch (err) {
      console.error('Approve failed:', err);
    }
  }

  async function handleRequestChanges(postId) {
    if (!changeNotes.trim()) return;
    try {
      await api.requestChanges(postId, null, changeNotes);
      setChangeNotes('');
      loadPosts();
    } catch (err) {
      console.error('Request changes failed:', err);
    }
  }

  async function handleBatchApprove() {
    if (selectedPosts.size === 0) return;
    try {
      await api.batchApprove([...selectedPosts]);
      setSelectedPosts(new Set());
      loadPosts();
    } catch (err) {
      console.error('Batch approve failed:', err);
    }
  }

  async function toggleAuditLog(postId) {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!auditLog[postId]) {
      try {
        const { log } = await api.getApprovalLog(postId);
        setAuditLog((prev) => ({ ...prev, [postId]: log }));
      } catch {
        setAuditLog((prev) => ({ ...prev, [postId]: [] }));
      }
    }
  }

  function toggleSelect(postId) {
    setSelectedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  }

  const counts = { pending: 0, approved: 0, changes_requested: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Approval Queue</h2>
          <p className="text-sm text-gray-400 mt-1">Review and approve posts before publishing</p>
        </div>
        {filter === 'pending' && selectedPosts.size > 0 && (
          <button
            onClick={handleBatchApprove}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Approve Selected ({selectedPosts.size})
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <button
              key={key}
              onClick={() => { setFilter(key); setSelectedPosts(new Set()); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key ? `${cfg.bg} ${cfg.color}` : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      {/* Post Cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400">No posts with status: {STATUS_CONFIG[filter]?.label}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const statusCfg = STATUS_CONFIG[post.approval_status] || STATUS_CONFIG.pending;
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedPost === post.id;
            const platforms = post.platforms || ['instagram'];
            const variant = post.caption_variants?.[post.selected_variant || 0];

            return (
              <div key={post.id} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Select checkbox (only for pending) */}
                    {filter === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedPosts.has(post.id)}
                        onChange={() => toggleSelect(post.id)}
                        className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                      />
                    )}

                    {/* Post info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-100 truncate">{post.title}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusCfg.label}
                        </span>
                      </div>

                      {/* Platform badges */}
                      <div className="flex items-center gap-2 mb-2">
                        {platforms.map((pid) => (
                          <PlatformBadge key={pid} platform={pid} />
                        ))}
                        {post.scheduled_date && (
                          <span className="text-xs text-gray-500 ml-2">
                            Scheduled: {new Date(post.scheduled_date).toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Caption preview */}
                      {variant && (
                        <p className="text-sm text-gray-400 line-clamp-2">{variant.caption_text}</p>
                      )}

                      {/* Creator info */}
                      {post.creator && (
                        <p className="text-xs text-gray-500 mt-2">
                          Created by {post.creator.name}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(`/compose?edit=${post.id}`)}
                        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                        title="View / Edit"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {filter === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(post.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-medium transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 rounded-lg text-xs font-medium transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Changes
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => toggleAuditLog(post.id)}
                        className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
                        title="Audit Log"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded section: Change request form + audit log */}
                {isExpanded && (
                  <div className="border-t border-gray-800 p-4 bg-gray-950/50 space-y-4">
                    {/* Request changes form */}
                    {filter === 'pending' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Request Changes</label>
                        <textarea
                          value={changeNotes}
                          onChange={(e) => setChangeNotes(e.target.value)}
                          placeholder="Describe what needs to be changed..."
                          rows={3}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                        />
                        <button
                          onClick={() => handleRequestChanges(post.id)}
                          disabled={!changeNotes.trim()}
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
                        >
                          Submit Feedback
                        </button>
                      </div>
                    )}

                    {/* Audit Log */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Audit Log
                      </h4>
                      {auditLog[post.id]?.length > 0 ? (
                        <div className="space-y-2">
                          {auditLog[post.id].map((entry) => (
                            <div key={entry.id} className="flex items-start gap-3 text-sm">
                              <div className="w-2 h-2 rounded-full bg-gray-600 mt-1.5 shrink-0" />
                              <div>
                                <span className="text-gray-300 font-medium">
                                  {entry.team_members?.name || 'System'}
                                </span>
                                <span className="text-gray-500 mx-1">—</span>
                                <span className="text-gray-400 capitalize">{entry.action.replace('_', ' ')}</span>
                                {entry.notes && (
                                  <p className="text-gray-500 mt-0.5 text-xs">"{entry.notes}"</p>
                                )}
                                <p className="text-gray-600 text-xs mt-0.5">
                                  {new Date(entry.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">No activity recorded yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
