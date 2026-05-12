import axios from 'axios';
import { getToken, logout } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const API_ORIGIN = API_BASE_URL.startsWith('http')
  ? new URL(API_BASE_URL).origin
  : window.location.origin;

// Exporting instance for testing visibility
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the admin auth token to every request if one exists
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

// If a stored token is rejected by the server, clear it so public pages still load
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
    }
    return Promise.reject(error);
  }
);

export function normalizeMediaUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
}

export function normalizeReport(report) {
  const normalizedPhoto = normalizeMediaUrl(report.photo ?? null);
  return {
    ...report,
    photo: normalizedPhoto,
    image: normalizedPhoto ?? report.image,
  };
}

export const reportService = {
  async getCategories() {
    const response = await api.get('/categories/');
    return response.data;
  },

  async getReports(params) {
    const response = await api.get('/reports/', { params });
    return {
      ...response.data,
      results: response.data.results.map(normalizeReport),
    };
  },

  async getReport(id) {
    const response = await api.get(`/reports/${id}/`);
    return normalizeReport(response.data);
  },

  async createReport(data) {
    const response = await api.post('/reports/', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return normalizeReport(response.data);
  },

  async updateReport(id, data) {
    const response = await api.patch(`/reports/${id}/`, data);
    return normalizeReport(response.data);
  },

  /**
   * Permanently delete a report (admin only).
   * @param {string} id - Report UUID
   * @returns {Promise<void>}
   */
  async deleteReport(id) {
    await api.delete(`/reports/${id}/`);
  },

  /**
   * Get a report by its anonymous tracking token (public).
   * @param {string} token - UUID tracking token
   * @returns {Promise<object>} Normalized report
   */
  async getReportByTrackingToken(token) {
    const response = await api.get(`/reports/track/${token}/`);
    return normalizeReport(response.data);
  },

  /**
   * Create a new category (admin only).
   * @param {{ name: string, icon?: string }} data
   * @returns {Promise<object>} Created category
   */
  async createCategory(data) {
    const response = await api.post('/categories/', data);
    return response.data;
  },

  /**
   * Update a category name or icon (admin only).
   * @param {number} id - Category pk
   * @param {{ name?: string, icon?: string }} data
   * @returns {Promise<object>} Updated category
   */
  async updateCategory(id, data) {
    const response = await api.patch(`/categories/${id}/`, data);
    return response.data;
  },

  /**
   * Delete a category (admin only). Throws if linked reports exist.
   * @param {number} id - Category pk
   * @returns {Promise<void>}
   */
  async deleteCategory(id) {
    await api.delete(`/categories/${id}/`);
  },
};
