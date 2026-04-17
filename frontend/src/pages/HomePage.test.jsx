import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from './HomePage';
import { reportService } from '../services/reportService';

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(reportService, 'getCategories').mockResolvedValue([{ id: 1, name: 'Lighting' }]);
  });

  it('renders loading state initially', () => {
    vi.spyOn(reportService, 'getReports').mockReturnValue(new Promise(() => {}));
    renderWithRouter(<HomePage />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders reports list on success', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({
      count: 1,
      results: [
        { id: '1', title: 'Test Report', status: 'open', created_at: '2026-04-17T12:00:00Z', category: { name: 'Lighting' } }
      ]
    });
    
    renderWithRouter(<HomePage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('reports-grid')).toBeInTheDocument();
      expect(screen.getByText('Test Report')).toBeInTheDocument();
    });
  });

  it('renders empty state when there are no reports', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ count: 0, results: [] });
    
    renderWithRouter(<HomePage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No reports found')).toBeInTheDocument();
    });
  });

  it('renders error state on API failure', async () => {
    vi.spyOn(reportService, 'getReports').mockRejectedValue(new Error('API failed'));
    
    renderWithRouter(<HomePage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument();
    });
  });
});
