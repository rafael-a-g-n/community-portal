import { describe, it, expect, beforeEach, vi } from 'vitest';
import { login, logout, getToken, isAuthenticated } from './authService';

// Mock axios to avoid real HTTP calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}));

import axios from 'axios';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('stores the token in localStorage on successful login', async () => {
    axios.post.mockResolvedValue({ data: { token: 'test-token-abc' } });

    const token = await login('admin', 'adminpass');

    expect(token).toBe('test-token-abc');
    expect(localStorage.getItem('community_portal_admin_token')).toBe('test-token-abc');
  });

  it('removes the token from localStorage on logout', async () => {
    localStorage.setItem('community_portal_admin_token', 'some-token');

    logout();

    expect(localStorage.getItem('community_portal_admin_token')).toBeNull();
  });

  it('getToken returns the stored token', () => {
    localStorage.setItem('community_portal_admin_token', 'my-token');
    expect(getToken()).toBe('my-token');
  });

  it('getToken returns null when not logged in', () => {
    expect(getToken()).toBeNull();
  });

  it('isAuthenticated returns true when token exists', () => {
    localStorage.setItem('community_portal_admin_token', 'any-token');
    expect(isAuthenticated()).toBe(true);
  });

  it('isAuthenticated returns false when no token', () => {
    expect(isAuthenticated()).toBe(false);
  });
});
