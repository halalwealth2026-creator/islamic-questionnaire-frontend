const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE_URL = (rawApiUrl || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function getBaseUrl() {
  if (!API_BASE_URL) {
    throw new ApiError('API URL is not configured. Please set VITE_API_URL.', 500);
  }
  return API_BASE_URL;
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${getBaseUrl()}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'Request failed. Please try again.', response.status);
  }

  return data;
}

export function submitQuestionnaire(payload) {
  return requestJson('/api/questionnaire/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

export function adminLogin(credentials) {
  return requestJson('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
}

export function fetchAdminDashboard(token) {
  return requestJson('/api/admin/dashboard', {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function fetchAdminResponses(
  token,
  { page = 1, limit = 15, search = '', startDate = '', endDate = '', language = '' } = {}
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit)
  });
  if (search.trim()) params.set('search', search.trim());
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (language) params.set('language', language);

  return requestJson(`/api/admin/responses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export function fetchAdminResponseDetail(token, id) {
  return requestJson(`/api/admin/responses/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function exportAdminResponsesCsv(
  token,
  { search = '', startDate = '', endDate = '', language = '' } = {}
) {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  if (language) params.set('language', language);

  const query = params.toString();
  const response = await fetch(
    `${getBaseUrl()}/api/admin/responses/export${query ? `?${query}` : ''}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(data.message || 'Unable to export responses.', response.status);
  }

  return response.blob();
}
