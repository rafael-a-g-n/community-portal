import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import NotFoundPage from './NotFoundPage';

function renderWithRouter(component) {
  return render(<BrowserRouter>{component}</BrowserRouter>);
}

describe('NotFoundPage', () => {
  it('renders 404 heading', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renders the notFound title from i18n', () => {
    renderWithRouter(<NotFoundPage />);
    // The mocked t() returns the key itself
    expect(screen.getByText('notFound.title')).toBeInTheDocument();
  });

  it('renders a home button', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByRole('button', { name: /nav\.home/i })).toBeInTheDocument();
  });
});
