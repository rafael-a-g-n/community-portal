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

  describe('getReportByTrackingToken', () => {
    it('calls GET /reports/track/{token}/ and normalizes response', async () => {
      const mockReport = { id: 'abc', title: 'Tracked', photo: null };
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockReport });

      const result = await reportService.getReportByTrackingToken('test-token');
      expect(api.get).toHaveBeenCalledWith('/reports/track/test-token/');
      expect(result.title).toBe('Tracked');
    });
  });

  describe('getComments', () => {
    it('calls GET /reports/{id}/comments/', async () => {
      const mockComments = [{ id: 1, body: 'A comment' }];
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: mockComments });

      const result = await reportService.getComments('report-123');
      expect(api.get).toHaveBeenCalledWith('/reports/report-123/comments/');
      expect(result).toEqual(mockComments);
    });
  });

  describe('createComment', () => {
    it('calls POST /reports/{id}/comments/ with data', async () => {
      const commentData = { author_name: 'User', body: 'Nice report!' };
      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { id: 1, ...commentData } });

      const result = await reportService.createComment('report-123', commentData);
      expect(api.post).toHaveBeenCalledWith('/reports/report-123/comments/', commentData);
      expect(result.body).toBe('Nice report!');
    });
  });

  describe('updateReport with multipart', () => {
    it('sends multipart/form-data when isMultipart is true', async () => {
      const formData = new FormData();
      formData.append('title', 'Updated');
      formData.append('status', 'resolved');

      vi.spyOn(api, 'patch').mockResolvedValueOnce({
        data: { id: '1', title: 'Updated', photo: null },
      });

      const result = await reportService.updateReport('1', formData, true);
      expect(api.patch).toHaveBeenCalledWith('/reports/1/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      expect(result.title).toBe('Updated');
    });
  });
});
