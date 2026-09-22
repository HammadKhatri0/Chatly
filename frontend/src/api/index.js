import client from './client.js';

export const authApi = {
  login: (payload) => client.post('/auth/login', payload),
  register: (payload) => client.post('/auth/register', payload),
  me: () => client.get('/auth/me'),
  changePassword: (payload) => client.patch('/auth/password', payload),
};

export const userApi = {
  profile: () => client.get('/users/me'),
  updateProfile: (data) => client.patch('/users/me', data),
  search: (params) => client.get('/users/search', { params }),
  byId: (id) => client.get(`/users/${id}`),
};

export const friendApi = {
  list: () => client.get('/friends'),
  requests: () => client.get('/friends/requests'),
  send: (userId) => client.post('/friends/requests', { userId }),
  respond: (id, action) => client.patch(`/friends/requests/${id}`, { action }),
  cancel: (id) => client.delete(`/friends/requests/${id}`),
  unfriend: (id) => client.delete(`/friends/${id}`),
};

export const conversationApi = {
  list: (params) => client.get('/conversations', { params }),
  candidates: () => client.get('/conversations/candidates'),
  openDirect: (userId) => client.post('/conversations/direct', { userId }),
  createGroup: (data) => client.post('/conversations/group', data),
  get: (id) => client.get(`/conversations/${id}`),
  update: (id, data) => client.patch(`/conversations/${id}`, data),
  remove: (id) => client.delete(`/conversations/${id}`),
  addMembers: (id, memberIds) => client.post(`/conversations/${id}/members`, { memberIds }),
  removeMember: (id, userId) => client.delete(`/conversations/${id}/members/${userId}`),
  markRead: (id) => client.patch(`/conversations/${id}/read`),
  messages: (id, params) => client.get(`/conversations/${id}/messages`, { params }),
  sendMessage: (id, data) => client.post(`/conversations/${id}/messages`, data),
};

export const messageApi = {
  search: (params) => client.get('/messages/search', { params }),
  remove: (id) => client.delete(`/messages/${id}`),
};

export const adminApi = {
  stats: () => client.get('/admin/stats'),
  users: (params) => client.get('/admin/users', { params }),
  user: (id) => client.get(`/admin/users/${id}`),
  createUser: (payload) => client.post('/admin/users', payload),
  updateUser: (id, payload) => client.patch(`/admin/users/${id}`, payload),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  conversations: (params) => client.get('/admin/conversations', { params }),
};
