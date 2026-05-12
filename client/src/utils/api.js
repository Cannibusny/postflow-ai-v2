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
  getAnalytics: () => apiFetch('/analytics'),
  getPostAnalytics: (id) => apiFetch(`/analytics/${id}`),
  refreshAnalytics: (id) =>
    apiFetch(`/analytics/${id}/refresh`, { method: 'POST' }),
};
