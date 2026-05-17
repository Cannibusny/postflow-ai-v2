import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Send,
  Clock,
  Save,
  ListPlus,
  Image as ImageIcon,
  X,
  Plus,
  Trash2,
  Hash,
  Eye,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Music2,
  Sparkles,
  ImagePlus,
  Shield,
  Target,
} from 'lucide-react';
import { api, PLATFORMS, CHAR_LIMITS, PLATFORM_MAP } from '../utils/api';
import InstagramPreview from '../components/InstagramPreview';
import AIContentModal from '../components/AIContentModal';
import AIImageModal from '../components/AIImageModal';
import ComplianceModal from '../components/ComplianceModal';
import PredictiveScoreModal from '../components/PredictiveScoreModal';
import HashtagSuggestions from '../components/HashtagSuggestions';

const PLATFORM_ICONS = { instagram: Instagram, facebook: Facebook, twitter: Twitter, linkedin: Linkedin, tiktok: Music2 };

const SCHEDULE_OPTIONS = [
  { key: 'now', label: 'Post Now', icon: Send, color: 'text-green-400' },
  { key: 'schedule', label: 'Schedule', icon: Clock, color: 'text-blue-400' },
  { key: 'queue', label: 'Add to Queue', icon: ListPlus, color: 'text-purple-400' },
  { key: 'draft', label: 'Save as Draft', icon: Save, color: 'text-gray-400' },
];

export default function Compose() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [form, setForm] = useState({
    title: '',
    caption: '',
    platforms: ['instagram'],
    hashtags: [],
    first_comment: '',
    image_url: '',
    image_emoji: '📸',
    media_urls: [],
    campaign: '',
    engagement_prediction: 50,
  });
  const [hashtagInput, setHashtagInput] = useState('');
  const [scheduleMode, setScheduleMode] = useState('draft');
  const [scheduledDate, setScheduledDate] = useState('');
  const [variants, setVariants] = useState([
    { variant_label: 'Direct', caption_text: '' },
    { variant_label: 'Storytelling', caption_text: '' },
    { variant_label: 'Challenge', caption_text: '' },
  ]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [saving, setSaving] = useState(false);
  const [previewPlatform, setPreviewPlatform] = useState('instagram');
  const [showCustomize, setShowCustomize] = useState(false);
  const [platformCustomizations, setPlatformCustomizations] = useState({});
  const [showAIContent, setShowAIContent] = useState(false);
  const [showAIImage, setShowAIImage] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showPredictive, setShowPredictive] = useState(false);

  useEffect(() => {
    if (editId) loadPost(editId);
  }, [editId]);

  async function loadPost(id) {
    try {
      const data = await api.getPost(id);
      const p = data.post;
      setForm({
        title: p.title || '',
        caption: '',
        platforms: p.platforms || ['instagram'],
        hashtags: p.hashtags || [],
        first_comment: p.first_comment || '',
        image_url: p.image_url || '',
        image_emoji: p.image_emoji || '📸',
        media_urls: p.media_urls || [],
        campaign: p.campaign || '',
        engagement_prediction: p.engagement_prediction || 50,
      });
      if (p.caption_variants?.length > 0) {
        setVariants(p.caption_variants.map((v) => ({
          variant_label: v.variant_label,
          caption_text: v.caption_text,
        })));
        setSelectedVariant(p.selected_variant || 0);
      }
      if (p.scheduled_date) {
        setScheduleMode('schedule');
        setScheduledDate(new Date(p.scheduled_date).toISOString().slice(0, 16));
      }
      if (p.platform_customizations) {
        setPlatformCustomizations(p.platform_customizations);
      }
    } catch (err) {
      alert('Failed to load post: ' + err.message);
    }
  }

  const activeCaption = variants[selectedVariant]?.caption_text || '';

  const charInfo = useMemo(() => {
    const results = {};
    for (const p of form.platforms) {
      const limit = CHAR_LIMITS[p] || 2200;
      const len = activeCaption.length;
      const pct = len / limit;
      results[p] = {
        len,
        limit,
        pct,
        color: pct > 1 ? 'text-red-400' : pct > 0.8 ? 'text-yellow-400' : 'text-green-400',
      };
    }
    return results;
  }, [activeCaption, form.platforms]);

  const lowestCharLimit = useMemo(() => {
    return Math.min(...form.platforms.map((p) => CHAR_LIMITS[p] || 2200));
  }, [form.platforms]);

  const charColor = useMemo(() => {
    const pct = activeCaption.length / lowestCharLimit;
    if (pct > 1) return 'text-red-400';
    if (pct > 0.8) return 'text-yellow-400';
    return 'text-green-400';
  }, [activeCaption, lowestCharLimit]);

  function togglePlatform(platformId) {
    setForm((prev) => {
      const exists = prev.platforms.includes(platformId);
      if (exists && prev.platforms.length === 1) return prev;
      return {
        ...prev,
        platforms: exists
          ? prev.platforms.filter((p) => p !== platformId)
          : [...prev.platforms, platformId],
      };
    });
  }

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !form.hashtags.includes(tag) && form.hashtags.length < 30) {
      setForm({ ...form, hashtags: [...form.hashtags, tag] });
    }
    setHashtagInput('');
  }

  function removeHashtag(tag) {
    setForm({ ...form, hashtags: form.hashtags.filter((t) => t !== tag) });
  }

  async function handleSubmit() {
    if (!form.title.trim()) {
      alert('Title is required');
      return;
    }
    setSaving(true);
    try {
      const status =
        scheduleMode === 'now'
          ? 'scheduled'
          : scheduleMode === 'schedule'
          ? 'scheduled'
          : 'draft';

      const payload = {
        title: form.title,
        image_url: form.image_url || null,
        image_emoji: form.image_emoji,
        platforms: form.platforms,
        media_urls: form.media_urls,
        hashtags: form.hashtags,
        first_comment: form.first_comment || null,
        campaign: form.campaign || null,
        engagement_prediction: form.engagement_prediction,
        platform_customizations: platformCustomizations,
        status,
        selected_variant: selectedVariant,
        variants: variants.filter((v) => v.caption_text.trim()),
      };

      if (scheduleMode === 'schedule' && scheduledDate) {
        payload.scheduled_date = new Date(scheduledDate).toISOString();
      } else if (scheduleMode === 'now') {
        payload.scheduled_date = new Date().toISOString();
      }

      if (scheduleMode === 'queue') {
        payload.queue_position = 9999;
      }

      if (editId) {
        await api.updatePost(editId, payload);
      } else {
        await api.createPost(payload);
      }

      if (scheduleMode === 'now' && !editId) {
        // Could trigger immediate publish
      }

      navigate('/');
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{editId ? 'Edit Post' : 'Create Post'}</h2>
          <p className="text-sm text-gray-500 mt-1">Compose and schedule across platforms</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Composer */}
        <div className="lg:col-span-2 space-y-5">
          {/* Title */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <label className="block mb-4">
              <span className="text-sm font-medium text-gray-300">Post Title</span>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What's this post about?"
                className="w-full mt-1.5 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 transition-colors"
              />
            </label>

            {/* Platform Selector */}
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-300 block mb-2">Platforms</span>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map(({ id, label, color }) => {
                  const Icon = PLATFORM_ICONS[id];
                  const isActive = form.platforms.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => togglePlatform(id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        isActive
                          ? 'border-transparent text-white'
                          : 'border-gray-700 text-gray-500 hover:border-gray-600 hover:text-gray-300 bg-gray-800/50'
                      }`}
                      style={isActive ? { backgroundColor: color + '30', borderColor: color + '60' } : {}}
                    >
                      <Icon className="w-4 h-4" style={isActive ? { color } : {}} />
                      {label}
                    </button>
                  );
                })}
              </div>
              {form.platforms.length > 1 && (
                <button
                  onClick={() => setShowCustomize(!showCustomize)}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showCustomize ? 'rotate-180' : ''}`} />
                  Customize per platform
                </button>
              )}
            </div>

            {/* AI Tools Bar */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5 border border-purple-500/20 rounded-xl">
              <button
                onClick={() => setShowAIContent(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Generate with AI
              </button>
              <button
                onClick={() => setShowAIImage(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 rounded-lg text-xs font-medium text-cyan-300 transition-all"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Generate Image
              </button>
              <button
                onClick={() => setShowPredictive(true)}
                disabled={!activeCaption.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600/30 hover:to-teal-600/30 border border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Target className="w-3.5 h-3.5" />
                Predict Score
              </button>
              <button
                onClick={() => setShowCompliance(true)}
                disabled={!activeCaption.trim()}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-amber-600/20 to-red-600/20 hover:from-amber-600/30 hover:to-red-600/30 border border-amber-500/30 rounded-lg text-xs font-medium text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <Shield className="w-3.5 h-3.5" />
                Compliance Check
              </button>
            </div>

            {/* Caption Variants */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">Caption Variants</span>
                <span className={`text-xs ${charColor}`}>
                  {activeCaption.length} / {lowestCharLimit}
                </span>
              </div>
              <div className="flex gap-1.5 mb-3">
                {variants.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedVariant(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedVariant === idx
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    {v.variant_label}
                  </button>
                ))}
                {variants.length < 6 && (
                  <button
                    onClick={() =>
                      setVariants([...variants, { variant_label: 'Direct', caption_text: '' }])
                    }
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <textarea
                value={variants[selectedVariant]?.caption_text || ''}
                onChange={(e) => {
                  const updated = [...variants];
                  updated[selectedVariant] = {
                    ...updated[selectedVariant],
                    caption_text: e.target.value,
                  };
                  setVariants(updated);
                }}
                rows={5}
                placeholder="Write your caption here..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 resize-none transition-colors"
              />
              {/* Character limits per platform */}
              {form.platforms.length > 1 && (
                <div className="flex gap-3 mt-2">
                  {form.platforms.map((p) => {
                    const info = charInfo[p];
                    if (!info) return null;
                    return (
                      <span key={p} className={`text-xs ${info.color}`}>
                        {PLATFORM_MAP[p]?.label}: {info.len}/{info.limit}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hashtag AI Suggestions */}
            <HashtagSuggestions
              caption={activeCaption}
              platforms={form.platforms}
              existingHashtags={form.hashtags}
              onAddHashtag={(tag) => {
                if (!form.hashtags.includes(tag) && form.hashtags.length < 30) {
                  setForm({ ...form, hashtags: [...form.hashtags, tag] });
                }
              }}
            />

            {/* Hashtags */}
            <div className="mb-4 mt-4">
              <span className="text-sm font-medium text-gray-300 block mb-2">
                Hashtags ({form.hashtags.length}/30)
              </span>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-300 rounded-md text-xs"
                  >
                    #{tag}
                    <button onClick={() => removeHashtag(tag)} className="hover:text-red-400">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      addHashtag();
                    }
                  }}
                  placeholder="Add hashtag..."
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  onClick={addHashtag}
                  className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                >
                  <Hash className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Media */}
            <div className="mb-4">
              <span className="text-sm font-medium text-gray-300 block mb-2">Media</span>
              <div className="flex gap-3">
                <label className="block flex-1">
                  <span className="text-xs text-gray-500">Image URL</span>
                  <input
                    type="url"
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </label>
                <label className="block w-24">
                  <span className="text-xs text-gray-500">Emoji</span>
                  <input
                    type="text"
                    value={form.image_emoji}
                    onChange={(e) => setForm({ ...form, image_emoji: e.target.value })}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </label>
              </div>
              {/* Drag-drop zone placeholder */}
              <div className="mt-3 border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-gray-600 transition-colors">
                <ImageIcon className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                <p className="text-sm text-gray-500">
                  Drag & drop images here, or paste a URL above
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  Supports JPG, PNG, WebP up to 10 images
                </p>
                <button
                  onClick={() => setShowAIImage(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs font-medium text-white transition-all"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  Generate with AI
                </button>
              </div>
            </div>

            {/* Instagram First Comment */}
            {form.platforms.includes('instagram') && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-300 block mb-2">
                  Instagram First Comment
                  <span className="text-gray-500 font-normal ml-2">Optional</span>
                </span>
                <input
                  type="text"
                  value={form.first_comment}
                  onChange={(e) => setForm({ ...form, first_comment: e.target.value })}
                  placeholder="Add link or extra hashtags as first comment..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            )}

            {/* Campaign */}
            <label className="block">
              <span className="text-sm font-medium text-gray-300">
                Campaign <span className="text-gray-500 font-normal">Optional</span>
              </span>
              <input
                type="text"
                value={form.campaign}
                onChange={(e) => setForm({ ...form, campaign: e.target.value })}
                placeholder="e.g. Black Friday, Holiday Menu"
                className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />
            </label>
          </div>

          {/* Scheduling Section */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <span className="text-sm font-medium text-gray-300 block mb-3">Schedule</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              {SCHEDULE_OPTIONS.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => setScheduleMode(key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                    scheduleMode === key
                      ? 'border-purple-500/50 bg-purple-500/10 text-white'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${scheduleMode === key ? color : ''}`} />
                  {label}
                </button>
              ))}
            </div>

            {scheduleMode === 'schedule' && (
              <label className="block">
                <span className="text-xs text-gray-500">Date & Time</span>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </label>
            )}

            {scheduleMode === 'queue' && (
              <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800/50 rounded-lg p-3">
                <ListPlus className="w-4 h-4 text-purple-400" />
                Post will be added to the next available queue slot
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving || !form.title.trim()}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-sm font-semibold transition-colors"
            >
              {saving ? (
                'Saving...'
              ) : scheduleMode === 'now' ? (
                <>
                  <Send className="w-4 h-4" /> Publish Now
                </>
              ) : scheduleMode === 'schedule' ? (
                <>
                  <Clock className="w-4 h-4" /> Schedule Post
                </>
              ) : scheduleMode === 'queue' ? (
                <>
                  <ListPlus className="w-4 h-4" /> Add to Queue
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Draft
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Eye className="w-4 h-4" /> Preview
              </span>
              {form.platforms.length > 1 && (
                <div className="flex gap-1">
                  {form.platforms.map((p) => {
                    const Icon = PLATFORM_ICONS[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setPreviewPlatform(p)}
                        className={`p-1.5 rounded-md transition-colors ${
                          previewPlatform === p
                            ? 'bg-purple-600/30 text-purple-400'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <InstagramPreview
              emoji={form.image_emoji}
              imageUrl={form.image_url}
              caption={
                activeCaption +
                (form.hashtags.length > 0
                  ? '\n\n' + form.hashtags.map((t) => '#' + t).join(' ')
                  : '')
              }
              title={form.title}
            />
          </div>

          {/* Post Info Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Post Summary</h4>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>Platforms</span>
                <span className="text-gray-300">{form.platforms.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Variants</span>
                <span className="text-gray-300">
                  {variants.filter((v) => v.caption_text.trim()).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hashtags</span>
                <span className="text-gray-300">{form.hashtags.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Media</span>
                <span className="text-gray-300">
                  {form.image_url ? '1 image' : 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Schedule</span>
                <span className="text-gray-300 capitalize">{scheduleMode}</span>
              </div>
              {form.campaign && (
                <div className="flex justify-between">
                  <span>Campaign</span>
                  <span className="text-gray-300">{form.campaign}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Modals */}
      {showAIContent && (
        <AIContentModal
          onClose={() => setShowAIContent(false)}
          platforms={form.platforms}
          onSelect={(text) => {
            const updated = [...variants];
            updated[selectedVariant] = {
              ...updated[selectedVariant],
              caption_text: text,
            };
            setVariants(updated);
          }}
        />
      )}

      {showAIImage && (
        <AIImageModal
          onClose={() => setShowAIImage(false)}
          onSelect={(url) => {
            setForm({ ...form, image_url: url });
          }}
        />
      )}

      {showCompliance && (
        <ComplianceModal
          onClose={() => setShowCompliance(false)}
          caption={activeCaption}
          onEdit={() => setShowCompliance(false)}
          onOverride={() => {
            setShowCompliance(false);
          }}
        />
      )}

      {showPredictive && (
        <PredictiveScoreModal
          onClose={() => setShowPredictive(false)}
          caption={activeCaption}
          hashtags={form.hashtags}
          platforms={form.platforms}
          scheduledTime={scheduledDate}
        />
      )}
    </div>
  );
}
