import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, BrowserRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportDetailPage from './ReportDetailPage';
import { reportService } from '../services/reportService';

const renderWithRouterAndParams = (component, path, initialEntries) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={path} element={component} />
      </Routes>
    </MemoryRouter>
  );
};

// Simplified renderer for just testing without explicit path injection matching
const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);


describe('ReportDetailPage', () => {
  const mockReport = {
    id: '1',
    title: 'Broken Sign',
    description: 'The street sign is falling down.',
    category: { name: 'Safety' },
    status: 'open',
    created_at: '2026-04-17T12:00:00Z',
    updated_at: '2026-04-17T12:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.spyOn(reportService, 'getReport').mockReturnValue(new Promise(() => {}));
    renderWithRouterAndParams(<ReportDetailPage />, '/reports/:id', ['/reports/1']);
    
    expect(screen.getByTestId('detail-loader')).toBeInTheDocument();
  });

  it('renders details once loaded', async () => {
    vi.spyOn(reportService, 'getReport').mockResolvedValue(mockReport);
    renderWithRouterAndParams(<ReportDetailPage />, '/reports/:id', ['/reports/1']);
    
    await waitFor(() => {
      expect(screen.getByText('Broken Sign')).toBeInTheDocument();
      expect(screen.getByText('Safety')).toBeInTheDocument();
    });
  });

  it('updates the status correctly', async () => {
    vi.spyOn(reportService, 'getReport').mockResolvedValue(mockReport);
    
    const updatedReport = { ...mockReport, status: 'in_progress' };
    vi.spyOn(reportService, 'updateReport').mockResolvedValue(updatedReport);
    
    renderWithRouterAndParams(<ReportDetailPage />, '/reports/:id', ['/reports/1']);
    
    await waitFor(() => {
      expect(screen.getByText('Broken Sign')).toBeInTheDocument();
    });

    const updateBtn = screen.getByRole('button', { name: /In Progress/i });
    fireEvent.click(updateBtn);
    
    await waitFor(() => {
      expect(reportService.updateReport).toHaveBeenCalledWith('1', { status: 'in_progress' });
    });
  });
});
