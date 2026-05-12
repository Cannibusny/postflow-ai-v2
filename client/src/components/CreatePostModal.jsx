import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { api } from '../utils/api';

const EMPTY_VARIANT = { variant_label: 'Direct', caption_text: '' };

export default function CreatePostModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    week_number: 1,
    image_emoji: '📸',
    scheduled_date: '',
    engagement_prediction: 50,
  });
  const [variants, setVariants] = useState([
    { variant_label: 'Direct', caption_text: '' },
    { variant_label: 'Storytelling', caption_text: '' },
    { variant_label: 'Challenge', caption_text: '' },
  ]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        week_number: Number(form.week_number),
        engagement_prediction: Number(form.engagement_prediction),
        status: form.scheduled_date ? 'scheduled' : 'draft',
        variants: variants.filter((v) => v.caption_text.trim()),
      };
      if (form.scheduled_date) {
        payload.scheduled_date = new Date(form.scheduled_date).toISOString();
      }
      await api.createPost(payload);
      onCreated();
    } catch (err) {
      alert(err.message);
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h3 className="text-lg font-bold">Create New Post</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm text-gray-400">Title</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              placeholder="Post title…"
            />
          </label>

          <div className="grid grid-cols-3 gap-4">
            <label className="block">
              <span className="text-sm text-gray-400">Week #</span>
              <input
                type="number"
                min="1"
                max="52"
                value={form.week_number}
                onChange={(e) => setForm({ ...form, week_number: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Emoji</span>
              <input
                type="text"
                value={form.image_emoji}
                onChange={(e) => setForm({ ...form, image_emoji: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">Engagement %</span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.engagement_prediction}
                onChange={(e) => setForm({ ...form, engagement_prediction: e.target.value })}
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm text-gray-400">Schedule Date</span>
            <input
              type="datetime-local"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
            />
          </label>

          {/* Caption Variants */}
          <div>
            <span className="text-sm text-gray-400 block mb-2">Caption Variants</span>
            {variants.map((v, idx) => (
              <div key={idx} className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <select
                    value={v.variant_label}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].variant_label = e.target.value;
                      setVariants(updated);
                    }}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs"
                  >
                    <option>Direct</option>
                    <option>Storytelling</option>
                    <option>Challenge</option>
                  </select>
                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setVariants(variants.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <textarea
                  value={v.caption_text}
                  onChange={(e) => {
                    const updated = [...variants];
                    updated[idx].caption_text = e.target.value;
                    setVariants(updated);
                  }}
                  rows={3}
                  placeholder="Caption text…"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>
            ))}
            {variants.length < 3 && (
              <button
                type="button"
                onClick={() => setVariants([...variants, { ...EMPTY_VARIANT }])}
                className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
              >
                <Plus className="w-3 h-3" /> Add Variant
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium disabled:opacity-50"
            >
              {saving ? 'Creating…' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
