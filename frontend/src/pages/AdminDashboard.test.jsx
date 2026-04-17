import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminDashboard from './AdminDashboard';
import { reportService } from '../services/reportService';
import * as authService from '../services/authService';
import * as settingsService from '../services/settingsService';
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockReports = [
  {
    id: 'uuid-1',
    title: 'Broken pavement',
    description: 'Cracked pavement near main road.',
    category: { name: 'Roads' },
    status: 'open',
    resolution_comment: '',
    created_at: '2026-04-17T10:00:00Z',
    updated_at: '2026-04-17T10:00:00Z',
  },
  {
    id: 'uuid-2',
    title: 'Missing street sign',
    description: 'Street sign is missing at junction.',
    category: { name: 'Safety' },
    status: 'resolved',
    resolution_comment: 'Sign replaced by team.',
    created_at: '2026-04-16T09:00:00Z',
    updated_at: '2026-04-17T08:00:00Z',
  },
];

const renderDashboard = () =>
  render(<BrowserRouter><AdminDashboard /></BrowserRouter>);

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(true);
    vi.spyOn(reportService, 'getCategories').mockResolvedValue([{ id: 1, name: 'Roads' }]);
  });

  it('redirects to /admin if not authenticated', () => {
    vi.spyOn(authService, 'isAuthenticated').mockReturnValue(false);
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ results: [], count: 0 });
    renderDashboard();
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  it('shows loading state initially', () => {
    vi.spyOn(reportService, 'getReports').mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByTestId('dashboard-loader')).toBeInTheDocument();
  });

  it('renders the reports table when data loads', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({
      results: mockReports,
      count: 2,
    });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('reports-table')).toBeInTheDocument();
      expect(screen.getByText('Broken pavement')).toBeInTheDocument();
      expect(screen.getByText('Missing street sign')).toBeInTheDocument();
    });
  });

  it('shows the edit drawer when clicking Manage', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({
      results: mockReports,
      count: 2,
    });
    renderDashboard();

    await waitFor(() => screen.getByTestId('reports-table'));

    fireEvent.click(screen.getByTestId('edit-btn-uuid-1'));

    await waitFor(() => {
      expect(screen.getByTestId('edit-drawer')).toBeInTheDocument();
    });
  });

  it('calls updateReport and closes drawer on save', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({
      results: mockReports,
      count: 2,
    });
    vi.spyOn(reportService, 'updateReport').mockResolvedValue({
      ...mockReports[0],
      status: 'in_progress',
    });
    renderDashboard();

    await waitFor(() => screen.getByTestId('reports-table'));
    fireEvent.click(screen.getByTestId('edit-btn-uuid-1'));
    await waitFor(() => screen.getByTestId('edit-drawer'));

    fireEvent.click(screen.getByTestId('save-btn'));

    await waitFor(() => {
      expect(reportService.updateReport).toHaveBeenCalledWith('uuid-1', expect.any(Object));
      expect(screen.queryByTestId('edit-drawer')).not.toBeInTheDocument();
    });
  });

  it('calls deleteReport and removes from list when delete is clicked', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(reportService, 'getReports').mockResolvedValue({
      results: mockReports,
      count: 2,
    });
    vi.spyOn(reportService, 'deleteReport').mockResolvedValue();
    renderDashboard();

    await waitFor(() => screen.getByTestId('reports-table'));
    fireEvent.click(screen.getByTestId('edit-btn-uuid-1'));
    await waitFor(() => screen.getByTestId('edit-drawer'));

    fireEvent.click(screen.getByTestId('delete-btn'));

    await waitFor(() => {
      expect(reportService.deleteReport).toHaveBeenCalledWith('uuid-1');
      expect(screen.queryByTestId('edit-drawer')).not.toBeInTheDocument();
      // Should remove from table
      expect(screen.queryByText('Broken pavement')).not.toBeInTheDocument();
      expect(screen.getByText('Missing street sign')).toBeInTheDocument();
    });
  });

  it('shows no-reports message when results are empty', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ results: [], count: 0 });
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('no-reports')).toBeInTheDocument();
    });
  });

  it('can switch to Categories tab and render categories', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ results: mockReports, count: 2 });
    vi.spyOn(reportService, 'getCategories').mockResolvedValue([{ id: 1, name: 'Roads', slug: 'roads', icon: '🛣️' }]);
    
    renderDashboard();
    
    // Switch tab
    fireEvent.click(screen.getByText('Categories'));
    
    await waitFor(() => {
      expect(screen.getByText('Manage Categories')).toBeInTheDocument();
      expect(screen.getByText('Roads')).toBeInTheDocument();
      expect(screen.getByText('🛣️')).toBeInTheDocument();
    });
  });

  it('can add a new category', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ results: [], count: 0 });
    vi.spyOn(reportService, 'getCategories').mockResolvedValue([]);
    vi.spyOn(reportService, 'createCategory').mockResolvedValue({ id: 99, name: 'Graffiti', icon: '🎨', slug: 'graffiti' });

    renderDashboard();
    fireEvent.click(screen.getByText('Categories'));

    await waitFor(() => screen.getByPlaceholderText('New Category Name'));
    
    fireEvent.change(screen.getByPlaceholderText('New Category Name'), { target: { value: 'Graffiti' } });
    fireEvent.change(screen.getByPlaceholderText('Icon (e.g. 🌳, 🛣️)'), { target: { value: '🎨' } });
    
    fireEvent.click(screen.getByText('Add Category'));

    await waitFor(() => {
      expect(reportService.createCategory).toHaveBeenCalledWith({ name: 'Graffiti', icon: '🎨' });
      expect(screen.getByText('Graffiti')).toBeInTheDocument();
    });
  });

  it('can delete a category', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ results: [], count: 0 });
    vi.spyOn(reportService, 'getCategories').mockResolvedValue([{ id: 1, name: 'Roads', slug: 'roads', icon: '🛣️' }]);
    vi.spyOn(reportService, 'deleteCategory').mockResolvedValue();

    renderDashboard();
    fireEvent.click(screen.getByText('Categories'));

    await waitFor(() => screen.getByTitle('Delete Category'));
    fireEvent.click(screen.getByTitle('Delete Category'));

    await waitFor(() => {
      expect(reportService.deleteCategory).toHaveBeenCalledWith(1);
      expect(screen.queryByText('Roads')).not.toBeInTheDocument();
    });
  });

  it('can switch to Site Settings tab and save settings', async () => {
    vi.spyOn(reportService, 'getReports').mockResolvedValue({ results: [], count: 0 });
    vi.spyOn(reportService, 'getCategories').mockResolvedValue([]);
    vi.spyOn(settingsService, 'updateSettings').mockResolvedValue({});

    // Spy on the SiteSettingsContext context? The default context handles default settings
    // so we should see "Community Portal".
    renderDashboard();

    fireEvent.click(screen.getByText('Site Settings'));

    await waitFor(() => {
      expect(screen.getByText('Site Settings CMS')).toBeInTheDocument();
    });

    const nameInputs = screen.getAllByDisplayValue('Community Portal'); 
    fireEvent.change(nameInputs[0], { target: { value: 'New Site Name' } });

    fireEvent.click(screen.getByTestId('save-settings-btn'));

    await waitFor(() => {
      expect(settingsService.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({ site_name: 'New Site Name' })
      );
      expect(screen.getByText(/Settings successfully updated/i)).toBeInTheDocument();
    });
  });
});
