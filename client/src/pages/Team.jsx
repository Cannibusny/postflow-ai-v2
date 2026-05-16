import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Shield,
  Eye,
  PenSquare,
  X,
  Activity,
  Clock,
  UserPlus,
} from 'lucide-react';
import { api } from '../utils/api';

const ROLE_CONFIG = {
  admin: { label: 'Admin', color: 'text-purple-400', bg: 'bg-purple-500/20', icon: Shield },
  creator: { label: 'Creator', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: PenSquare },
  viewer: { label: 'Viewer', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: Eye },
};

export default function Team() {
  const [tab, setTab] = useState('members');
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', role: 'creator' });

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'members') {
        const { members: data } = await api.getTeamMembers();
        setMembers(data || []);
      } else {
        const { activities: data } = await api.getActivityFeed(50);
        setActivities(data || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }

  async function handleAddMember(e) {
    e.preventDefault();
    try {
      await api.addTeamMember(form);
      setForm({ name: '', email: '', role: 'creator' });
      setShowAdd(false);
      loadData();
    } catch (err) {
      console.error('Add member failed:', err);
    }
  }

  async function handleDeleteMember(id) {
    try {
      await api.deleteTeamMember(id);
      loadData();
    } catch (err) {
      console.error('Delete member failed:', err);
    }
  }

  async function handleUpdateRole(id, role) {
    try {
      await api.updateTeamMember(id, { role });
      loadData();
    } catch (err) {
      console.error('Update role failed:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Team</h2>
          <p className="text-sm text-gray-400 mt-1">Manage team members and view activity</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Add member form */}
      {showAdd && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add Team Member</h3>
            <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleAddMember} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-400 mb-1 block">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-400 mb-1 block">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="admin">Admin</option>
                <option value="creator">Creator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex gap-2 border-b border-gray-800 pb-3">
        {[
          { id: 'members', label: 'Members', icon: Users },
          { id: 'activity', label: 'Activity Feed', icon: Activity },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No team members yet</p>
            <p className="text-gray-600 text-sm mt-1">Add your first team member to start collaborating</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const roleCfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
              const RoleIcon = roleCfg.icon;
              return (
                <div key={member.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {member.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-200">{member.name}</h3>
                      {!member.is_active && (
                        <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs">Inactive</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 ${roleCfg.bg} ${roleCfg.color} cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-500/50`}
                    >
                      <option value="admin">Admin</option>
                      <option value="creator">Creator</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Activity feed tab */}
      {tab === 'activity' && (
        loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400">No activity yet</p>
            <p className="text-gray-600 text-sm mt-1">Team activity will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg border border-gray-800">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                  {activity.team_members?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200">
                    <span className="font-medium">{activity.team_members?.name || 'System'}</span>
                    <span className="text-gray-400 mx-1">{activity.action}</span>
                    <span className="text-gray-500 capitalize">{activity.entity_type}</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
