import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ListChecks,
  BarChart3,
  PenSquare,
  Zap,
  Plus,
} from 'lucide-react';
import PostQueue from './pages/PostQueue';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import PostDetail from './pages/PostDetail';
import Compose from './pages/Compose';

const navItems = [
  { to: '/', icon: ListChecks, label: 'Queue' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/compose', icon: PenSquare, label: 'Compose' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

export default function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">PostFlow AI</h1>
              <p className="text-xs text-gray-500">Professional Edition</p>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <button
            onClick={() => navigate('/compose')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Post
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<PostQueue />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/compose" element={<Compose />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/posts/:id" element={<PostDetail />} />
        </Routes>
      </main>
    </div>
  );
}
