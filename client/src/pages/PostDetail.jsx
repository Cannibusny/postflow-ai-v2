import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  Trash2,
  Save,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../utils/api';
import InstagramPreview from '../components/InstagramPreview';

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    loadPost();
  }, [id]);

  async function loadPost() {
    try {
      const data = await api.getPost(id);
      setPost(data.post);
      setEditData({
        title: data.post.title,
        scheduled_date: data.post.scheduled_date
          ? new Date(data.post.scheduled_date).toISOString().slice(0, 16)
          : '',
        selected_variant: data.post.selected_variant || 0,
        status: data.post.status,
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updatePayload = {
        title: editData.title,
        selected_variant: editData.selected_variant,
      };
      if (editData.scheduled_date) {
        updatePayload.scheduled_date = new Date(editData.scheduled_date).toISOString();
        updatePayload.status = 'scheduled';
      }
      await api.updatePost(id, updatePayload);
      await loadPost();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  }

  async function handlePublish() {
    if (!confirm('Publish this post immediately?')) return;
    try {
      await api.publishPost(id);
      await loadPost();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handlePause() {
    try {
      await api.pausePost(id);
      await loadPost();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this post permanently?')) return;
    try {
      await api.deletePost(id);
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading…</div>;
  if (!post) return <div className="text-center py-12 text-red-400">Post not found</div>;

  const variants = post.caption_variants || [];
  const selectedCaption = variants[editData.selected_variant]?.caption_text || post.title;

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Queue
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Edit Panel */}
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Post</h2>
              <div className="flex gap-2">
                {post.status !== 'posted' && (
                  <button
                    onClick={handlePublish}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-sm"
                  >
                    <Play className="w-3 h-3" /> Publish Now
                  </button>
                )}
                {post.status === 'scheduled' && (
                  <button
                    onClick={handlePause}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-sm"
                  >
                    <Pause className="w-3 h-3" /> Pause
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>

            {/* Title */}
            <label className="block mb-4">
              <span className="text-sm text-gray-400">Title</span>
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </label>

            {/* Schedule */}
            <label className="block mb-4">
              <span className="text-sm text-gray-400">Scheduled Date</span>
              <input
                type="datetime-local"
                value={editData.scheduled_date || ''}
                onChange={(e) => setEditData({ ...editData, scheduled_date: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </label>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

          {/* Caption Variants */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Caption Variants</h3>
            {variants.length > 0 ? (
              <div className="space-y-3">
                {variants.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setEditData({ ...editData, selected_variant: idx })}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      editData.selected_variant === idx
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-400">
                        {v.variant_label}
                      </span>
                      {editData.selected_variant === idx && (
                        <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-300 whitespace-pre-line line-clamp-4">
                      {v.caption_text}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No caption variants</p>
            )}
          </div>
        </div>

        {/* Right: Instagram Preview */}
        <div>
          <InstagramPreview
            emoji={post.image_emoji}
            imageUrl={post.image_url}
            caption={selectedCaption}
            title={editData.title || post.title}
          />

          {/* Post Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
            <h3 className="text-lg font-semibold mb-3">Post Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="capitalize">{post.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Week</span>
                <span>{post.week_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Engagement Prediction</span>
                <span>{post.engagement_prediction}%</span>
              </div>
              {post.posted_at && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Posted</span>
                  <span>{new Date(post.posted_at).toLocaleString()}</span>
                </div>
              )}
              {post.last_error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {post.last_error}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
