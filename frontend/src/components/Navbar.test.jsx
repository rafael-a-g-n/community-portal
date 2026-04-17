import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import Navbar from './Navbar';

// Provide a minimal SiteSettingsContext mock
vi.mock('../context/SiteSettingsContext', () => ({
  useSiteSettings: () => ({
    localizedSettings: {
      navbar_brand_text: 'Community Portal',
      navbar_cta_text: 'New Report',
    },
    settings: {},
    refreshSettings: vi.fn(),
  }),
}));

const renderWithRouter = (component) => render(<BrowserRouter>{component}</BrowserRouter>);

describe('Navbar Component', () => {
  it('renders branding Community Portal', () => {
    renderWithRouter(<Navbar />);
    expect(screen.getByText('Community Portal')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Navbar />);
    // Links use t() keys in test environment
    expect(screen.getByText('nav.home')).toBeInTheDocument();
    expect(screen.getByText('nav.about')).toBeInTheDocument();
    // CTA comes from localizedSettings mock
    expect(screen.getByText('New Report')).toBeInTheDocument();
  });
});
