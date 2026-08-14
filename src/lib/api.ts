export const API_URL = import.meta.env.VITE_API_URL || 'https://api.mkverse.my.id';

export function getAuthToken(): string | null {
  return localStorage.getItem('mkverse_auth_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('mkverse_auth_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('mkverse_auth_token');
}

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}
