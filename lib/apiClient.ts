
/**
 * Production API Client for DrealtiesFx Academy
 * Professional-grade HTTP client for Laravel backend
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

class ApiClientError extends Error {
  public status: number;
  public errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
  }
}

const logger = (method: string, endpoint: string, data?: any, response?: any, error?: boolean) => {
  if (process.env.NODE_ENV === 'development') {
    const style = error
      ? 'background: #7f1d1d; color: #fca5a5; font-weight: bold;'
      : 'background: #1e293b; color: #D4AF37; font-weight: bold;';

    console.group(`%c API: ${method} ${endpoint} `, style);
    if (data) console.log('Request:', data);
    if (response) console.log('Response:', response);
    console.groupEnd();
  }
};

const handleResponse = async (response: Response, method: string, endpoint: string) => {
  const contentType = response.headers.get('content-type');
  let responseData: any;

  if (contentType && contentType.includes('application/json')) {
    responseData = await response.json();
  } else {
    responseData = await response.text();
  }

  if (!response.ok) {
    // Don't log 401 errors as they're expected when tokens expire
    if (response.status !== 401 && process.env.NODE_ENV === 'development') {
      logger(method, endpoint, null, responseData, true);
    }

    throw new ApiClientError(
      responseData.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      responseData.errors
    );
  }

  return responseData;
};

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
};

export const apiClient = {
  async get(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const data = await handleResponse(response, 'GET', endpoint);
    logger('GET', endpoint, null, data);
    return data;
  },

  async post(endpoint: string, data: any) {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(isFormData),
      body: isFormData ? data : JSON.stringify(data),
    });

    const responseData = await handleResponse(response, 'POST', endpoint);
    logger('POST', endpoint, data, responseData);
    return responseData;
  },

  async patch(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const responseData = await handleResponse(response, 'PATCH', endpoint);
    logger('PATCH', endpoint, data, responseData);
    return responseData;
  },

  async put(endpoint: string, data: any) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const responseData = await handleResponse(response, 'PUT', endpoint);
    logger('PUT', endpoint, data, responseData);
    return responseData;
  },

  async delete(endpoint: string) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await handleResponse(response, 'DELETE', endpoint);
    logger('DELETE', endpoint, null, data);
    return data;
  },

  // Authentication helpers
  setAuthToken(token: string) {
    localStorage.setItem('auth_token', token);
  },

  removeAuthToken() {
    localStorage.removeItem('auth_token');
  },

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }
};

/**
 * Normalizes a URL by prefixing relative paths with API_BASE_URL
 */
export const normalizeUrl = (url: string | null | undefined) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('data:')) return url;
  // Ensure we don't have double slashes
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${cleanUrl}`;
};

export { ApiClientError };
