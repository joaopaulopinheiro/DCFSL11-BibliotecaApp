const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function getToken() {
  return localStorage.getItem('token');
}

function handleExpiredSession() {
  localStorage.removeItem('token');
  window.location.href = '/login';
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.message || data.error || `Erro ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export async function get(path) {
  return request(path, { method: 'GET' });
}

export async function post(path, body, isFormData = false) {
  const token = getToken();
  if (isFormData) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Converter objeto para FormData se necessário
    let formDataBody = body;
    if (!(body instanceof FormData)) {
      formDataBody = new FormData();
      for (const [key, value] of Object.entries(body)) {
        if (value !== null && value !== undefined) {
          formDataBody.append(key, value);
        }
      }
    }

    const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers, body: formDataBody });
    if (res.status === 401) { handleExpiredSession(); return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.message || `Erro ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  return request(path, { method: 'POST', body: JSON.stringify(body) });
}

export async function put(path, body, isFormData = false) {
  const token = getToken();
  if (isFormData) {
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Converter objeto para FormData se necessário
    let formDataBody = body;
    if (!(body instanceof FormData)) {
      formDataBody = new FormData();
      for (const [key, value] of Object.entries(body)) {
        if (value !== null && value !== undefined) {
          formDataBody.append(key, value);
        }
      }
    }

    const res = await fetch(`${BASE_URL}${path}`, { method: 'PUT', headers, body: formDataBody });
    if (res.status === 401) { handleExpiredSession(); return; }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const err = new Error(data.message || `Erro ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }
  return request(path, { method: 'PUT', body: JSON.stringify(body) });
}

export async function del(path) {
  return request(path, { method: 'DELETE' });
}

export { BASE_URL };
