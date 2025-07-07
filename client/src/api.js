const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const handleResponseError = async (response) => {
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('unauthorized'));
  }

  let errorMessage = `Request failed (status ${response.status})`;
  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.error || errorMessage;
    console.error('API Error:', errorData);
  } catch (e) {
    console.error('Error parsing error response:', e);
  }

  throw new Error(errorMessage);
};

export const request = async (path, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {})
  };

  const requestOptions = {
    ...options,
    headers
  };

  if (options.body) {
    requestOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, requestOptions);

    if (!response.ok) {
      return handleResponseError(response);
    }

    if (response.status === 204) return null;
    return response.json();
  } catch (error) {
    console.error('Network error:', error);
    throw new Error('Network error occurred. Please try again.');
  }
};

// Auth API
export const authApi = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  refreshToken: (token) => request('/auth/refresh', { method: 'POST', body: { token } }),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: data }),
  deleteProfile: () => request('/auth/profile', { method: 'DELETE' })
};

// Templates API
export const templatesApi = {
  createTemplate: (templateData) => request('/templates', { method: 'POST', body: templateData }),
  getPublicTemplates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/templates/public?${query}`);
  },
  getUserTemplates: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/templates/user?${query}`);
  },
  getTemplateById: (id) => request(`/templates/${id}`),
  updateTemplate: (id, templateData) => request(`/templates/${id}`, { method: 'PUT', body: templateData }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),
  deleteMultipleTemplates: (ids) => request('/templates', {
    method: 'DELETE',
    body: { ids }
  }),
  addQuestionToTemplate: (templateId, question) =>
    request(`/templates/${templateId}/questions`, {
      method: 'POST',
      body: { question }
    }),
  getPopularTemplates: (limit = 5) =>
    request(`/templates/public?limit=${limit}&sort=popular`)
};

// Forms API
export const formsApi = {
  getMyForms: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/forms?${query}`);
  },
  getFormById: (id) => request(`/forms/${id}`),
  createFormFromTemplate: (templateId) =>
    request(`/forms/create/${templateId}`, { method: 'POST' }),
  submitForm: (formData) => request('/forms', { method: 'POST', body: formData }),
  updateForm: (id, formData) => request(`/forms/${id}`, { method: 'PUT', body: formData }),
  deleteForm: (id) => request(`/forms/${id}`, { method: 'DELETE' }),
  updateFormAnswers: (id, answers, completed) =>
    request(`/forms/${id}`, {
      method: 'PUT',
      body: { answers, completed }
    })
};

// Tags API
export const tagsApi = {
  getAllTags: () => request('/tags'),
  getPopularTags: (limit = 20) => request(`/tags/popular?limit=${limit}`),
  searchTags: (query) => request(`/tags/search?q=${encodeURIComponent(query)}`),
  getTemplatesByTag: (tagName) => request(`/tags/${encodeURIComponent(tagName)}/templates`)
};

// Comments API
export const commentsApi = {
  getTemplateComments: (templateId) => request(`/comments/template/${templateId}`),
  addComment: (templateId, text) =>
    request('/comments', {
      method: 'POST',
      body: { text, templateId }
    }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' })
};

// Likes API
export const likesApi = {
  toggleLike: (templateId) => request(`/likes/${templateId}`, { method: 'POST' }),
  getLikeCount: (templateId) => request(`/likes/${templateId}/count`),
  getLikeStatus: (templateId) => request(`/likes/${templateId}/status`)
};

// Analytics API
export const analyticsApi = {
  getTemplateAnalytics: (templateId) => request(`/analytics/template/${templateId}`),
  getUserAnalytics: (userId) => request(`/analytics/user/${userId}`),
  getPlatformAnalytics: () => request('/analytics/platform')
};

// Admin API
export const adminApi = {
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/users?${query}`);
  },
  updateUserRole: (id, role) =>
    request(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: { role }
    }),
  toggleUserBlock: (id, isBlocked) =>
    request(`/admin/users/${id}/block`, {
      method: 'PUT',
      body: { isBlocked }
    }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' })
};

export default {
  auth: authApi,
  templates: templatesApi,
  forms: formsApi,
  tags: tagsApi,
  comments: commentsApi,
  likes: likesApi,
  analytics: analyticsApi,
  admin: adminApi,
  request
};
