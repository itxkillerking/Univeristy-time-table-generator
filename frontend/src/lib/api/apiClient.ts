function getCsrfToken() {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; csrftoken=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const isFormData = options.body instanceof FormData;
  const csrf = getCsrfToken();
  const headers = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(csrf && { 'X-CSRFToken': csrf }),
    ...(options.headers || {})
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Important for Django session auth
  });
}
