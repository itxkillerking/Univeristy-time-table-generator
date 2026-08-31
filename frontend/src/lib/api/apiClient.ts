export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include' // Important for Django session auth
  });
}
