import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { usePosts } from '../hooks/usePosts';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

const STATUS_COLORS = {
  draft: 'border-gray-600 bg-gray-800/50',
  scheduled: 'border-blue-500 bg-blue-500/10',
  posted: 'border-green-500 bg-green-500/10',
  failed: 'border-red-500 bg-red-500/10',
};

export default function CalendarView() {
  const { posts, loading } = usePosts();
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const postsByDate = useMemo(() => {
    const map = {};
    for (const post of posts) {
      if (!post.scheduled_date) continue;
      const key = format(new Date(post.scheduled_date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(post);
    }
    return map;
  }, [posts]);

  const prevMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Calendar</h2>
        <div className="flex items-center gap-4">
          <button onClick={prevMonth} className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700">
            ←
          </button>
          <span className="text-lg font-semibold min-w-[180px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700">
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : (
        <>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs text-gray-500 py-2 font-medium">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-800 rounded-xl overflow-hidden">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd');
              const dayPosts = postsByDate[key] || [];
              const inMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={key}
                  className={`min-h-[100px] p-2 ${
                    inMonth ? 'bg-gray-900' : 'bg-gray-950'
                  }`}
                >
                  <div
                    className={`text-xs mb-1 ${
                      isToday(day)
                        ? 'text-purple-400 font-bold'
                        : inMonth
                        ? 'text-gray-400'
                        : 'text-gray-600'
                    }`}
                  >
                    {format(day, 'd')}
                  </div>
                  {dayPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/posts/${post.id}`}
                      className={`block text-xs px-2 py-1 rounded border mb-1 truncate hover:brightness-125 transition-all ${
                        STATUS_COLORS[post.status]
                      }`}
                    >
                      {post.image_emoji} {post.title}
                    </Link>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
