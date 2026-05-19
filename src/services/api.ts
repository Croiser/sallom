const API_URL = '';

async function request(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

function buildUrl(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint;
  const filtered = Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined);
  if (filtered.length === 0) return endpoint;
  const qs = new URLSearchParams(filtered.map(([k, v]) => [k, String(v)])).toString();
  return `${endpoint}?${qs}`;
}

export const api = {
  get: (endpoint: string, options?: { params?: Record<string, any> }) =>
    request(buildUrl(endpoint, options?.params), { method: 'GET' }),
  post: (endpoint: string, data: any = {}) => request(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint: string, data: any = {}) => request(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint: string) => request(endpoint, { method: 'DELETE' }),

  // WhatsApp & WAHA Specific Methods
  getWahaStatus: () => request('/whatsapp/waha/status', { method: 'GET' }),
  getWahaQr: () => request('/whatsapp/waha/qr', { method: 'GET' }),
  startWahaSession: () => request('/whatsapp/waha/session/start', { method: 'POST' }),
  getWhatsAppSettings: () => request('/whatsapp-settings', { method: 'GET' }),
  updateWhatsAppSettings: (data: any) => request('/whatsapp-settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Sales & PDV
  getSales: () => request('/sales', { method: 'GET' }),
  createSale: (data: any) => request('/sales', { method: 'POST', body: JSON.stringify(data) }),
};
