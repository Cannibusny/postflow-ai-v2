const API_BASE = '/api';

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('postflow_token') || '';
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API error: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Posts
  getPosts: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/posts${qs}`);
  },
  getPost: (id) => apiFetch(`/posts/${id}`),
  createPost: (data) =>
    apiFetch('/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id, data) =>
    apiFetch(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePost: (id) => apiFetch(`/posts/${id}`, { method: 'DELETE' }),
  publishPost: (id) =>
    apiFetch(`/posts/${id}/publish`, { method: 'POST' }),
  pausePost: (id) =>
    apiFetch(`/posts/${id}/pause`, { method: 'POST' }),

  // Analytics
  getAnalytics: () => apiFetch('/analytics'),
  getPostAnalytics: (id) => apiFetch(`/analytics/${id}`),
  refreshAnalytics: (id) =>
    apiFetch(`/analytics/${id}/refresh`, { method: 'POST' }),

  // Queue
  getQueueSettings: () => apiFetch('/queue/settings'),
  addQueueSetting: (data) =>
    apiFetch('/queue/settings', { method: 'POST', body: JSON.stringify(data) }),
  deleteQueueSetting: (id) =>
    apiFetch(`/queue/settings/${id}`, { method: 'DELETE' }),
  getQueuePosts: () => apiFetch('/queue/posts'),
  reorderQueue: (order) =>
    apiFetch('/queue/reorder', { method: 'PUT', body: JSON.stringify({ order }) }),
  toggleQueuePause: (paused) =>
    apiFetch('/queue/pause', { method: 'POST', body: JSON.stringify({ paused }) }),

  // Team
  getTeamMembers: () => apiFetch('/team'),
  addTeamMember: (data) =>
    apiFetch('/team', { method: 'POST', body: JSON.stringify(data) }),
  updateTeamMember: (id, data) =>
    apiFetch(`/team/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTeamMember: (id) => apiFetch(`/team/${id}`, { method: 'DELETE' }),
  getActivityFeed: (limit) =>
    apiFetch(`/team/activity${limit ? `?limit=${limit}` : ''}`),

  // Approvals
  getPendingApprovals: (status) =>
    apiFetch(`/approvals${status ? `?status=${status}` : ''}`),
  approvePost: (id, approved_by) =>
    apiFetch(`/approvals/${id}/approve`, { method: 'POST', body: JSON.stringify({ approved_by }) }),
  requestChanges: (id, actor_id, notes) =>
    apiFetch(`/approvals/${id}/request-changes`, { method: 'POST', body: JSON.stringify({ actor_id, notes }) }),
  resubmitPost: (id, actor_id) =>
    apiFetch(`/approvals/${id}/resubmit`, { method: 'POST', body: JSON.stringify({ actor_id }) }),
  batchApprove: (post_ids, approved_by) =>
    apiFetch('/approvals/batch-approve', { method: 'POST', body: JSON.stringify({ post_ids, approved_by }) }),
  getApprovalLog: (id) => apiFetch(`/approvals/${id}/log`),

  // Notes
  getPostNotes: (postId) => apiFetch(`/notes/${postId}`),
  addPostNote: (postId, data) =>
    apiFetch(`/notes/${postId}`, { method: 'POST', body: JSON.stringify(data) }),
  deletePostNote: (postId, noteId) =>
    apiFetch(`/notes/${postId}/${noteId}`, { method: 'DELETE' }),

  // Monitoring
  getMonitoringKeywords: () => apiFetch('/monitoring/keywords'),
  addMonitoringKeyword: (data) =>
    apiFetch('/monitoring/keywords', { method: 'POST', body: JSON.stringify(data) }),
  deleteMonitoringKeyword: (id) =>
    apiFetch(`/monitoring/keywords/${id}`, { method: 'DELETE' }),
  getMentions: (params) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/monitoring/mentions${qs}`);
  },
  updateMention: (id, data) =>
    apiFetch(`/monitoring/mentions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getMonitoringStats: () => apiFetch('/monitoring/stats'),

  // Reports
  getReports: () => apiFetch('/reports'),
  createReport: (data) =>
    apiFetch('/reports', { method: 'POST', body: JSON.stringify(data) }),
  getReport: (id) => apiFetch(`/reports/${id}`),
  deleteReport: (id) => apiFetch(`/reports/${id}`, { method: 'DELETE' }),
  getScheduledReports: () => apiFetch('/reports/scheduled/list'),
  createScheduledReport: (data) =>
    apiFetch('/reports/scheduled', { method: 'POST', body: JSON.stringify(data) }),
  deleteScheduledReport: (id) =>
    apiFetch(`/reports/scheduled/${id}`, { method: 'DELETE' }),

  // AI
  generateContent: (data) =>
    apiFetch('/ai/generate-content', { method: 'POST', body: JSON.stringify(data) }),
  generateImage: (data) =>
    apiFetch('/ai/generate-image', { method: 'POST', body: JSON.stringify(data) }),
  complianceCheck: (data) =>
    apiFetch('/ai/compliance-check', { method: 'POST', body: JSON.stringify(data) }),
  predictScore: (data) =>
    apiFetch('/ai/predict-score', { method: 'POST', body: JSON.stringify(data) }),
  suggestHashtags: (data) =>
    apiFetch('/ai/suggest-hashtags', { method: 'POST', body: JSON.stringify(data) }),
};

export const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', color: '#E4405F', bgClass: 'bg-pink-500', textClass: 'text-pink-400' },
  { id: 'facebook', label: 'Facebook', color: '#1877F2', bgClass: 'bg-blue-600', textClass: 'text-blue-400' },
  { id: 'twitter', label: 'X (Twitter)', color: '#1DA1F2', bgClass: 'bg-sky-500', textClass: 'text-sky-400' },
  { id: 'linkedin', label: 'LinkedIn', color: '#0A66C2', bgClass: 'bg-blue-800', textClass: 'text-blue-300' },
  { id: 'tiktok', label: 'TikTok', color: '#FF0050', bgClass: 'bg-red-600', textClass: 'text-red-400' },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

export const CHAR_LIMITS = {
  instagram: 2200,
  facebook: 63206,
  twitter: 280,
  linkedin: 3000,
  tiktok: 2200,
};
