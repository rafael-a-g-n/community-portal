import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import ReportCard from './ReportCard';
import StatusBadge from './StatusBadge';

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('StatusBadge', () => {
  it('formats open status properly', () => {
    render(<StatusBadge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('formats in_progress status properly', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('formats resolved status properly', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });
});

describe('ReportCard Component', () => {
  const mockReport = {
    id: '123',
    title: 'Test Issue',
    description: 'This is a test description',
    category: { name: 'Lighting' },
    status: 'in_progress',
    created_at: '2026-04-17T12:00:00Z'
  };

  it('renders report details correctly', () => {
    renderWithRouter(<ReportCard report={mockReport} />);
    
    expect(screen.getByText('Test Issue')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
    expect(screen.getByText('Lighting')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText(new Date(mockReport.created_at).toLocaleDateString())).toBeInTheDocument();
  });
});
