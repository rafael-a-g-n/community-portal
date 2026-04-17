import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateReportPage from './CreateReportPage';
import { reportService } from '../services/reportService';

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('CreateReportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(reportService, 'getCategories').mockResolvedValue([{ id: 1, name: 'Lighting' }]);
  });

  it('renders form and handles input changes', async () => {
    vi.spyOn(reportService, 'createReport').mockResolvedValue({});
    renderWithRouter(<CreateReportPage />);
    
    await waitFor(() => {
      expect(screen.getByText('createReport.title')).toBeInTheDocument();
    });

    const titleInput = screen.getByPlaceholderText('createReport.issueTitlePlaceholder');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });
    expect(titleInput.value).toBe('Test Title');
  });
});
