import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const API_ORIGIN = new URL(API_BASE_URL).origin;

// Exporting instance for testing visibility
export const api = axios.create({
  baseURL: API_BASE_URL,
});

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
};
