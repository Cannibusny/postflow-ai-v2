import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ListChecks,
  BarChart3,
  PenSquare,
  Zap,
  Plus,
  CheckCircle,
  Radio,
  FileText,
  Users,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import PostQueue from './pages/PostQueue';
import CalendarView from './pages/CalendarView';
import Analytics from './pages/Analytics';
import PostDetail from './pages/PostDetail';
import Compose from './pages/Compose';
import Approvals from './pages/Approvals';
import Monitoring from './pages/Monitoring';
import Reports from './pages/Reports';
import Team from './pages/Team';
import BulkUpload from './pages/BulkUpload';

const primaryNav = [
  { to: '/', icon: ListChecks, label: 'Queue' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/compose', icon: PenSquare, label: 'Compose' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
];

const secondaryNav = [
  { to: '/approvals', icon: CheckCircle, label: 'Approvals' },
  { to: '/monitoring', icon: Radio, label: 'Listening' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/bulk-upload', icon: Upload, label: 'Bulk Upload' },
];

export default function App() {
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

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
            {primaryNav.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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

            {/* More dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMore(!showMore)}
                className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showMore ? 'bg-gray-800 text-gray-200' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                More
                {showMore ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showMore && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-xl z-50 py-1">
                    {secondaryNav.map(({ to, icon: Icon, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setShowMore(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
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
                  </div>
                </>
              )}
            </div>
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
          <Route path="/approvals" element={<Approvals />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/team" element={<Team />} />
          <Route path="/bulk-upload" element={<BulkUpload />} />
        </Routes>
      </main>
    </div>
  );
}
