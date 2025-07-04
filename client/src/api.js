const API_BASE_URL = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

export async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
    localStorage.removeItem('token'); 
    }
    let errorMsg = `Ошибка запроса (код ${res.status})`;
    try {
      const data = await res.json();
      console.log('Ошибка с сервера:', data);
      errorMsg = data.error || data.message || errorMsg;
    } catch (e) {
      console.log('Ошибка парсинга тела ошибки', e);
    }
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null;
  return res.json();
}


export const login = (credentials) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

export const register = (data) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getMe = () => request('/auth/me');

export const logout = () =>
  request('/auth/logout', {
    method: 'POST',
  });

export const getPublicTemplates = () => request('/templates/public');
export const getUserTemplates = () => request('/templates/user');
export const getTemplateById = (id) => request(`/templates/${id}`);
export const createTemplate = (templateData) =>
  request('/templates', {
    method: 'POST',
    body: JSON.stringify(templateData),
  });

export const updateTemplate = (id, templateData) =>
  request(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(templateData),
  });

export const deleteTemplate = (id) =>
  request(`/templates/${id}`, {
    method: 'DELETE',
  });

export const getMyForms = () => request('/forms/user');
export const getFormById = (id) => request(`/forms/${id}`);
export const getFormsByTemplate = (templateId) =>
  request(`/forms/template/${templateId}`);

export const submitForm = (formData) =>
  request('/forms', {
    method: 'POST',
    body: JSON.stringify(formData),
  });

export const updateForm = (id, formData) =>
  request(`/forms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(formData),
  });

export const deleteForm = (id) =>
  request(`/forms/${id}`, {
    method: 'DELETE',
  });

export const getAllTags = () => request('/tags');
