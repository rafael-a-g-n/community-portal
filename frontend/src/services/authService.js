import axios from 'axios';

const AUTH_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'community_portal_admin_token';

/**
 * Log in as an admin, store the returned token in localStorage.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<string>} The auth token
 */
export async function login(username, password) {
  const response = await axios.post(`${AUTH_BASE_URL}/auth/login/`, {
    username,
    password,
  });
  const { token } = response.data;
  localStorage.setItem(TOKEN_KEY, token);
  return token;
}

/**
 * Remove the stored token, effectively logging out.
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get the stored auth token, or null if not logged in.
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Returns true if a token is currently stored.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return Boolean(getToken());
}
