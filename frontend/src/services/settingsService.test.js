import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSettings, updateSettings } from './settingsService';
import { api } from './reportService';

describe('settingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSettings calls GET /settings/', async () => {
    const mockSettings = { site_name: 'Community Portal', hero_title: 'Make It Better' };
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockSettings });

    const result = await getSettings();

    expect(api.get).toHaveBeenCalledWith('/settings/');
    expect(result).toEqual(mockSettings);
  });

  it('updateSettings calls PATCH /settings/ with data', async () => {
    const payload = { hero_title: 'A New Title', navbar_cta_text: 'Report Now' };
    vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: { ...payload } });

    const result = await updateSettings(payload);

    expect(api.patch).toHaveBeenCalledWith('/settings/', payload);
    expect(result.hero_title).toBe('A New Title');
  });

  it('updateSettings returns the updated settings from the server', async () => {
    const updated = { site_name: 'My City', hero_title: 'Welcome' };
    vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: updated });

    const result = await updateSettings({ site_name: 'My City' });

    expect(result).toEqual(updated);
  });

  it('getSettings handles network error gracefully', async () => {
    vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('Network Error'));

    await expect(getSettings()).rejects.toThrow('Network Error');
  });

  it('updateSettings sends correct content-type for string data', async () => {
    const payload = { hero_title: 'New Title' };
    vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: payload });

    await updateSettings(payload);
    expect(api.patch).toHaveBeenCalledWith('/settings/', payload);
  });

  it('getSettings returns full settings object with all fields', async () => {
    const mockSettings = {
      site_name: 'Test Portal',
      site_tagline: 'Test tagline',
      navbar_brand_text: 'Test',
      hero_title: 'Test Hero',
      hero_subtitle: 'Test subtitle',
      hero_cta_text: 'Submit',
      about_title: 'About',
      about_body: 'About body',
    };
    vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockSettings });

    const result = await getSettings();
    expect(Object.keys(result)).toContain('site_name');
    expect(Object.keys(result)).toContain('hero_title');
  });

});
