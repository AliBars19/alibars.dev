import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { note } from '@/content';
import { StickyNote } from './StickyNote';

describe('StickyNote', () => {
  it('renders the exact note copy', () => {
    render(<StickyNote />);
    expect(screen.getByText(note)).toBeInTheDocument();
  });

  it('is a div, not a <p>, so no UA margin shifts it from the spec top:-22px', () => {
    render(<StickyNote />);
    expect(screen.getByText(note).tagName).toBe('DIV');
  });
});
