import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('base-class', 'conditional-class')).toBe('base-class conditional-class');
    });

    it('resolves tailwind conflicts via tailwind-merge', () => {
      expect(cn('p-4 px-2', 'p-8')).toBe('p-8');
    });

    it('handles conditional classes format', () => {
      expect(cn('base', { 'active': true, 'inactive': false })).toBe('base active');
    });
  });
});
