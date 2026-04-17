import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportDetailPage from './ReportDetailPage';
import { reportService } from '../services/reportService';

const renderWithRouterAndParams = (component, path, initialEntries) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={path} element={component} />
      </Routes>
    </MemoryRouter>
  );

describe('ReportDetailPage', () => {
  const mockReport = {
    id: '1',
    title: 'Broken Sign',
    description: 'The street sign is falling down.',
    category: { name: 'Safety' },
    status: 'open',
    resolution_comment: '',
    created_at: '2026-04-17T12:00:00Z',
    updated_at: '2026-04-17T12:00:00Z',
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

  it('does NOT show status management buttons for public users', async () => {
    vi.spyOn(reportService, 'getReport').mockResolvedValue(mockReport);
    renderWithRouterAndParams(<ReportDetailPage />, '/reports/:id', ['/reports/1']);

    await waitFor(() => screen.getByText('Broken Sign'));

    expect(screen.queryByRole('button', { name: /In Progress/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Resolved/i })).not.toBeInTheDocument();
  });

  it('shows the resolution comment block when present', async () => {
    const resolvedReport = {
      ...mockReport,
      status: 'resolved',
      resolution_comment: 'The sign has been replaced by our team.',
    };
    vi.spyOn(reportService, 'getReport').mockResolvedValue(resolvedReport);
    renderWithRouterAndParams(<ReportDetailPage />, '/reports/:id', ['/reports/1']);

    await waitFor(() => {
      expect(screen.getByTestId('resolution-comment')).toBeInTheDocument();
      expect(screen.getByText('The sign has been replaced by our team.')).toBeInTheDocument();
    });
  });

  it('does NOT show resolution comment block when comment is empty', async () => {
    vi.spyOn(reportService, 'getReport').mockResolvedValue(mockReport);
    renderWithRouterAndParams(<ReportDetailPage />, '/reports/:id', ['/reports/1']);

    await waitFor(() => screen.getByText('Broken Sign'));

    expect(screen.queryByTestId('resolution-comment')).not.toBeInTheDocument();
  });
});
