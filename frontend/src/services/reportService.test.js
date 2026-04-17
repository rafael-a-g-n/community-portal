import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportService, api, normalizeMediaUrl, normalizeReport } from './reportService';

describe('reportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('normalizeMediaUrl', () => {
    it('returns undefined for empty input', () => {
      expect(normalizeMediaUrl(null)).toBeUndefined();
      expect(normalizeMediaUrl('')).toBeUndefined();
    });

    it('returns http/https URLs as-is', () => {
      expect(normalizeMediaUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg');
    });

    it('prepends origin for relative URLs', () => {
      const url = '/media/photos/test.jpg';
      const result = normalizeMediaUrl(url);
      expect(result.endsWith(url)).toBe(true);
      expect(result.startsWith('http')).toBe(true);
    });
  });

  describe('normalizeReport', () => {
    it('normalizes photo URL', () => {
      const report = { id: 1, title: 'Test', photo: '/media/test.jpg' };
      const result = normalizeReport(report);
      expect(result.photo.startsWith('http')).toBe(true);
    });

    it('maps image property to photo if available', () => {
      const report = { id: 1, photo: null, image: 'fallback.jpg' };
      const result = normalizeReport(report);
      expect(result.photo).toBeUndefined();
      expect(result.image).toBe('fallback.jpg');
    });
  });

  describe('API Calls', () => {
    it('getCategories fetches correctly', async () => {
      const mockData = [{ id: 1, name: 'Pothole' }];
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockData });
      
      const result = await reportService.getCategories();
      
      expect(api.get).toHaveBeenCalledWith('/categories/');
      expect(result).toEqual(mockData);
    });

    it('getReports fetches and normalizes correctly', async () => {
      const mockResponse = {
        count: 1,
        results: [{ id: 1, title: 'Pothole', photo: '/test.jpg' }]
      };
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockResponse });

      const result = await reportService.getReports({ status: 'open' });

      expect(api.get).toHaveBeenCalledWith('/reports/', { params: { status: 'open' } });
      expect(result.count).toBe(1);
      expect(result.results[0].photo.startsWith('http')).toBe(true);
    });

    it('createReport uses multipart form data header', async () => {
      const mockData = { id: 2, title: 'New' };
      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockData });
      
      const formData = new FormData();
      formData.append('title', 'New');
      
      await reportService.createReport(formData);

      expect(api.post).toHaveBeenCalledWith('/reports/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });
  }); // end 'API Calls'

  describe('Admin API Calls', () => {
    it('deleteReport sends DELETE to correct URL', async () => {
      vi.spyOn(api, 'delete').mockResolvedValueOnce({});
      await reportService.deleteReport('uuid-abc');
      expect(api.delete).toHaveBeenCalledWith('/reports/uuid-abc/');
    });

    it('createCategory sends POST with data', async () => {
      const mockCat = { id: 1, name: 'Parks', slug: 'parks', icon: '🌳' };
      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockCat });
      const result = await reportService.createCategory({ name: 'Parks', icon: '🌳' });
      expect(api.post).toHaveBeenCalledWith('/categories/', { name: 'Parks', icon: '🌳' });
      expect(result).toEqual(mockCat);
    });

    it('updateCategory sends PATCH to correct URL with data', async () => {
      const mockCat = { id: 2, name: 'Roads', slug: 'roads', icon: '🛣️' };
      vi.spyOn(api, 'patch').mockResolvedValueOnce({ data: mockCat });
      const result = await reportService.updateCategory(2, { name: 'Roads' });
      expect(api.patch).toHaveBeenCalledWith('/categories/2/', { name: 'Roads' });
      expect(result).toEqual(mockCat);
    });

    it('deleteCategory sends DELETE to correct URL', async () => {
      vi.spyOn(api, 'delete').mockResolvedValueOnce({});
      await reportService.deleteCategory(3);
      expect(api.delete).toHaveBeenCalledWith('/categories/3/');
    });
  });
});
