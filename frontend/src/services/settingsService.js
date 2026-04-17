import { api } from './reportService';

/**
 * Fetch the site-wide CMS settings.
 * Public endpoint — no authentication required.
 * @returns {Promise<object>} SiteSettings object
 */
export async function getSettings() {
  const response = await api.get('/settings/');
  return response.data;
}

/**
 * Partially update the site settings (admin only).
 * The auth token is attached automatically by the axios interceptor.
 * @param {object} data - Partial SiteSettings fields to update
 * @returns {Promise<object>} Updated SiteSettings object
 */
export async function updateSettings(data) {
  const response = await api.patch('/settings/', data);
  return response.data;
}
