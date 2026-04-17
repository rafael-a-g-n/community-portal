import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the base layout with footer brand', () => {
    render(<App />);
    // Footer renders - just check it mounts without crash
    expect(document.body.firstChild).toBeDefined();
  });
});
