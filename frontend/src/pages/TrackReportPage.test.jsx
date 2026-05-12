import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TrackReportPage from './TrackReportPage';
import { reportService } from '../services/reportService';

vi.mock('../services/reportService', () => ({
  reportService: {
    getReportByTrackingToken: vi.fn(),
  },
  normalizeMediaUrl: (url) => url || undefined,
}));

function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('TrackReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the tracking form', () => {
    renderWithRouter(<TrackReportPage />);
    expect(screen.getByTestId('track-form')).toBeInTheDocument();
    expect(screen.getByTestId('track-input')).toBeInTheDocument();
    expect(screen.getByTestId('track-submit')).toBeInTheDocument();
  });

  it('shows error for invalid token', async () => {
    reportService.getReportByTrackingToken.mockRejectedValueOnce({
      response: { status: 404 },
    });

    renderWithRouter(<TrackReportPage />);
    fireEvent.change(screen.getByTestId('track-input'), { target: { value: 'invalid-token' } });
    fireEvent.click(screen.getByTestId('track-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('track-error')).toBeInTheDocument();
    });
  });

  it('shows report details for valid token', async () => {
    const mockReport = {
      id: '123',
      title: 'Test Report',
      description: 'Test description',
      status: 'open',
      tracking_token: 'valid-token',
      category: { id: 1, name: 'Roads' },
      created_at: '2026-01-01T00:00:00Z',
      resolution_comment: '',
    };

    reportService.getReportByTrackingToken.mockResolvedValueOnce(mockReport);

    renderWithRouter(<TrackReportPage />);
    fireEvent.change(screen.getByTestId('track-input'), { target: { value: 'valid-token' } });
    fireEvent.click(screen.getByTestId('track-submit'));

    await waitFor(() => {
      expect(screen.getByTestId('track-result')).toBeInTheDocument();
      expect(screen.getByText('Test Report')).toBeInTheDocument();
    });
  });

  it('disables submit button when input is empty', () => {
    renderWithRouter(<TrackReportPage />);
    expect(screen.getByTestId('track-submit')).toBeDisabled();
  });

  it('enables submit button when input has value', () => {
    renderWithRouter(<TrackReportPage />);
    fireEvent.change(screen.getByTestId('track-input'), { target: { value: 'some-token' } });
    expect(screen.getByTestId('track-submit')).not.toBeDisabled();
  });
});
