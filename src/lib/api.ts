const API_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      if (isJson) {
        const error = await response.json();
        errorMessage = error.error || errorMessage;
      } else {
        const text = await response.text();
        console.error('Non-JSON error response:', text);
        if (text.includes('<!doctype html>') || text.includes('<html>')) {
          errorMessage = 'O servidor retornou uma página HTML em vez de JSON. Verifique se a rota da API está correta.';
        }
      }
    } catch (e) {
      console.error('Error parsing error response:', e);
    }
    throw new Error(errorMessage);
  }

  if (!isJson) {
    const text = await response.text();
    console.error('Expected JSON but received:', text);
    throw new Error('O servidor não retornou um JSON válido.');
  }

  return response.json();
}
