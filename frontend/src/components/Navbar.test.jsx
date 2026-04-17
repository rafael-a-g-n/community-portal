import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Navbar from './Navbar';

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('Navbar Component', () => {
  it('renders branding Community Portal', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText('Community Portal')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText('Browse Reports')).toBeInTheDocument();
    expect(screen.getByText('How it Works')).toBeInTheDocument();
    expect(screen.getByText('New Report')).toBeInTheDocument();
  });
});
