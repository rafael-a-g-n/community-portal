import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
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
      // empty_state_title comes from localizedSettings default value
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('renders error state on API failure', async () => {
    vi.spyOn(reportService, 'getReports').mockRejectedValue(new Error('API failed'));
    
    renderWithRouter(<HomePage />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
      // Error title uses t('common.error') key in test mode (appears in h3 and p)
      expect(screen.getAllByText('common.error').length).toBeGreaterThan(0);
    });
  });

  it('triggers search after debounce delay', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ count: 0, results: [] });
    
    renderWithRouter(<HomePage />);
    
    // Initial call on mount
    await waitFor(() => expect(reportService.getReports).toHaveBeenCalled());

    const searchInput = screen.getByPlaceholderText('common.search');
    fireEvent.change(searchInput, { target: { value: 'pavement' } });

    // Wait for the debounce (300ms) + some buffer for the async effect
    await new Promise(r => setTimeout(r, 500));

    // Ensure the fetch is called with the search param
    await waitFor(() => {
      expect(reportService.getReports).toHaveBeenCalledWith(expect.objectContaining({ 
        search: 'pavement' 
      }));
    });
  });
});
