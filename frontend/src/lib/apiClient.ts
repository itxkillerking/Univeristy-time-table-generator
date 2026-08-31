const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrftoken=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  
  const csrf = getCsrfToken();
  if (csrf) {
    headers.set('X-CSRFToken', csrf);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Important for sending/receiving HttpOnly JWT cookies
  });

  return response;
}
