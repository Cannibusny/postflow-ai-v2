import React, { useMemo, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import { api, PLATFORM_MAP } from '../utils/api';
import { PlatformBadgeRow } from '../components/PlatformBadge';
import JsonLd from '../components/JsonLd';
import { buildPostListSchemas, buildImageGallerySchema } from '../utils/schemaMarkup';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfDay,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  getHours,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
  X,
  Clock,
} from 'lucide-react';

const STATUS_COLORS = {
  draft: 'border-gray-600 bg-gray-800/60 hover:bg-gray-800',
  scheduled: 'border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20',
  posted: 'border-green-500/40 bg-green-500/10 hover:bg-green-500/20',
  failed: 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20',
};

const STATUS_DOT = {
  draft: 'bg-gray-500',
  scheduled: 'bg-blue-500',
  posted: 'bg-green-500',
  failed: 'bg-red-500',
};

const VIEW_MODES = [
  { key: 'month', icon: LayoutGrid, label: 'Month' },
  { key: 'week', icon: List, label: 'Week' },
];

export default function CalendarView() {
  const navigate = useNavigate();
  const { posts, loading, refetch } = usePosts();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month');
  const [statusFilter, setStatusFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [dragPost, setDragPost] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [sidebarPost, setSidebarPost] = useState(null);

  const filteredPosts = useMemo(() => {
    let filtered = posts;
    if (statusFilter) filtered = filtered.filter((p) => p.status === statusFilter);
    if (platformFilter)
      filtered = filtered.filter((p) =>
        (p.platforms || ['instagram']).includes(platformFilter)
      );
    return filtered;
  }, [posts, statusFilter, platformFilter]);

  const days = useMemo(() => {
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    }
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate, viewMode]);

  const postsByDate = useMemo(() => {
    const map = {};
    for (const post of filteredPosts) {
      if (!post.scheduled_date) continue;
      const key = format(new Date(post.scheduled_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(post);
    }
    return map;
  }, [filteredPosts]);

  const navigate_period = (dir) => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + dir);
    } else {
      d.setDate(d.getDate() + 7 * dir);
    }
    setCurrentDate(d);
  };

  const handleDragStart = (e, post) => {
    setDragPost(post);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', post.id);
  };

  const handleDragOver = (e, dayKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(dayKey);
  };

  const handleDrop = async (e, dayKey) => {
    e.preventDefault();
    setDropTarget(null);
    if (!dragPost) return;

    const oldDate = dragPost.scheduled_date ? new Date(dragPost.scheduled_date) : new Date();
    const newDate = new Date(dayKey + 'T00:00:00');
    newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), 0, 0);

    try {
      await api.updatePost(dragPost.id, {
        scheduled_date: newDate.toISOString(),
        status: 'scheduled',
      });
      refetch();
    } catch (err) {
      console.error('Reschedule failed:', err);
    }
    setDragPost(null);
  };

  const handleDragEnd = () => {
    setDragPost(null);
    setDropTarget(null);
  };

  const periodLabel =
    viewMode === 'month'
      ? format(currentDate, 'MMMM yyyy')
      : `${format(startOfWeek(currentDate), 'MMM d')} – ${format(
          addDays(startOfWeek(currentDate), 6),
          'MMM d, yyyy'
        )}`;

  const unscheduledPosts = filteredPosts.filter((p) => !p.scheduled_date);

  const postSchemas = buildPostListSchemas(filteredPosts);
  const gallerySchema = buildImageGallerySchema(filteredPosts);
  const allSchemas = [...postSchemas, ...(gallerySchema ? [gallerySchema] : [])];

  return (
    <div className="flex gap-6">
      {allSchemas.length > 0 && <JsonLd schema={allSchemas} />}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-purple-400" />
            <h2 className="text-2xl font-bold">Calendar</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex bg-gray-800 rounded-lg p-0.5">
              {VIEW_MODES.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    viewMode === key
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-1.5 text-gray-300"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="posted">Posted</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm rounded-lg px-3 py-1.5 text-gray-300"
            >
              <option value="">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="twitter">X (Twitter)</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
            </select>

            {/* Navigation */}
            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={() => navigate_period(-1)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs font-medium transition-colors"
              >
                Today
              </button>
              <span className="text-sm font-semibold min-w-[180px] text-center">
                {periodLabel}
              </span>
              <button
                onClick={() => navigate_period(1)}
                className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => navigate('/compose')}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors ml-2"
            >
              <Plus className="w-4 h-4" />
              New Post
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs text-gray-500 py-2 font-medium uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-800/50 rounded-xl overflow-hidden">
              {days.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayPosts = postsByDate[key] || [];
                const inMonth = viewMode === 'week' || isSameMonth(day, currentDate);
                const isDropping = dropTarget === key;

                return (
                  <div
                    key={key}
                    className={`${
                      viewMode === 'week' ? 'min-h-[200px]' : 'min-h-[110px]'
                    } p-1.5 transition-colors ${
                      isDropping
                        ? 'bg-purple-500/20 ring-2 ring-purple-500/50 ring-inset'
                        : inMonth
                        ? 'bg-gray-900'
                        : 'bg-gray-950/80'
                    }`}
                    onDragOver={(e) => handleDragOver(e, key)}
                    onDragLeave={() => setDropTarget(null)}
                    onDrop={(e) => handleDrop(e, key)}
                  >
                    <div
                      className={`text-xs mb-1 flex items-center justify-between ${
                        isToday(day)
                          ? ''
                          : inMonth
                          ? 'text-gray-400'
                          : 'text-gray-600'
                      }`}
                    >
                      <span
                        className={
                          isToday(day)
                            ? 'bg-purple-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs'
                            : ''
                        }
                      >
                        {format(day, 'd')}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="text-gray-600 text-xs">{dayPosts.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, viewMode === 'week' ? 10 : 3).map((post) => (
                        <div
                          key={post.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, post)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSidebarPost(post)}
                          className={`text-xs px-1.5 py-1 rounded border cursor-grab active:cursor-grabbing truncate transition-all flex items-center gap-1 ${
                            STATUS_COLORS[post.status]
                          } ${dragPost?.id === post.id ? 'opacity-40' : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[post.status]}`} />
                          <PlatformBadgeRow platforms={post.platforms || ['instagram']} size="sm" />
                          <span className="truncate">{post.title}</span>
                          {post.scheduled_date && (
                            <span className="text-gray-500 ml-auto shrink-0">
                              {format(new Date(post.scheduled_date), 'h:mm a')}
                            </span>
                          )}
                        </div>
                      ))}
                      {dayPosts.length > (viewMode === 'week' ? 10 : 3) && (
                        <div className="text-xs text-gray-500 pl-1.5">
                          +{dayPosts.length - (viewMode === 'week' ? 10 : 3)} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sidebar: Post Quick View or Unscheduled Posts */}
      {sidebarPost ? (
        <div className="w-80 shrink-0">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-20">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Post Details</h3>
              <button onClick={() => setSidebarPost(null)} className="p-1 hover:bg-gray-800 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-3xl mb-3">{sidebarPost.image_emoji || '📸'}</div>
            <h4 className="font-medium mb-2">{sidebarPost.title}</h4>
            <div className="flex items-center gap-2 mb-3">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[sidebarPost.status]}`} />
              <span className="text-xs capitalize text-gray-400">{sidebarPost.status}</span>
              <PlatformBadgeRow platforms={sidebarPost.platforms || ['instagram']} />
            </div>
            {sidebarPost.scheduled_date && (
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(sidebarPost.scheduled_date), 'MMM d, yyyy h:mm a')}
              </div>
            )}
            {sidebarPost.caption_variants?.[sidebarPost.selected_variant || 0] && (
              <p className="text-xs text-gray-300 line-clamp-4 mb-3">
                {sidebarPost.caption_variants[sidebarPost.selected_variant || 0].caption_text}
              </p>
            )}
            <div className="flex gap-2">
              <Link
                to={`/posts/${sidebarPost.id}`}
                className="flex-1 text-center px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-medium transition-colors"
              >
                Edit Post
              </Link>
              <Link
                to={`/compose?edit=${sidebarPost.id}`}
                className="flex-1 text-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                Open Composer
              </Link>
            </div>
          </div>
        </div>
      ) : unscheduledPosts.length > 0 ? (
        <div className="w-72 shrink-0">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sticky top-20">
            <h3 className="font-semibold text-sm mb-3">
              Unscheduled ({unscheduledPosts.length})
            </h3>
            <p className="text-xs text-gray-500 mb-3">Drag to calendar to schedule</p>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {unscheduledPosts.map((post) => (
                <div
                  key={post.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, post)}
                  onDragEnd={handleDragEnd}
                  className="text-xs px-2 py-2 rounded-lg border border-gray-700 bg-gray-800/50 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{post.image_emoji || '📸'}</span>
                    <span className="truncate">{post.title}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <PlatformBadgeRow platforms={post.platforms || ['instagram']} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
