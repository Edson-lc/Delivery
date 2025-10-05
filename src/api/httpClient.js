import { getAuthToken } from './session';

// Configuração da URL da API - usar localhost para desenvolvimento
const getApiBaseUrl = () => {
  // Se VITE_API_URL estiver definido, usar ele
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Para desenvolvimento local, usar localhost
  // Isso evita problemas de CORS
  return 'http://localhost:4000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Debug: Log da URL da API sendo usada
console.log('🔧 API_BASE_URL configurada para:', API_BASE_URL);
console.log('🌐 Hostname atual:', window.location.hostname);
console.log('📱 User Agent:', navigator.userAgent);
console.log('✅ Usando localhost para evitar problemas de CORS');

function buildHeaders(custom = {}) {
  const token = getAuthToken();
  const baseHeaders = {
    'Content-Type': 'application/json',
    ...custom,
  };

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  return baseHeaders;
}

async function handleResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorMessage =
      data?.error?.message ||
      data?.message ||
      (typeof data === 'string' ? data : null) ||
      `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiRequest(path, { method = 'GET', headers, body, query } = {}) {
  const url = new URL(path.startsWith('http') ? path : `${API_BASE_URL}${path}`);

  if (query && typeof query === 'object') {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((v) => url.searchParams.append(key, String(v)));
      } else {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const options = {
    method,
    headers: {
      ...buildHeaders(headers),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  };

  if (method === 'GET' || method === 'HEAD') {
    delete options.body;
  }

  const response = await fetch(url, options);
  return handleResponse(response);
}

export function toCamelCaseKey(key) {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

export function transformKeys(input, transformer = toCamelCaseKey) {
  if (!input || typeof input !== 'object' || input instanceof Date) {
    return input;
  }

  if (Array.isArray(input)) {
    return input.map((item) => transformKeys(item, transformer));
  }

  return Object.entries(input).reduce((acc, [key, value]) => {
    acc[transformer(key)] = transformKeys(value, transformer);
    return acc;
  }, {});
}

export function toSnakeCaseKey(key) {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toSnakeCase(input) {
  return transformKeys(input, toSnakeCaseKey);
}

export function toCamelCase(input) {
  return transformKeys(input, toCamelCaseKey);
}

export function transformKeysShallow(input, transformer = toCamelCaseKey) {
  if (!input || typeof input !== 'object' || input instanceof Date || Array.isArray(input)) {
    return input;
  }

  return Object.entries(input).reduce((acc, [key, value]) => {
    acc[transformer(key)] = value;
    return acc;
  }, {});
}

// Objeto httpClient para compatibilidade com os hooks
export const httpClient = {
  get: (url) => apiRequest(url, { method: 'GET' }),
  post: (url, data) => apiRequest(url, { method: 'POST', body: data }),
  put: (url, data) => apiRequest(url, { method: 'PUT', body: data }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
  patch: (url, data) => apiRequest(url, { method: 'PATCH', body: data }),
};

// Exportação default também
export default httpClient;
