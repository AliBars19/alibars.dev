import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { note } from '@/content';
import { StickyNote } from './StickyNote';

describe('StickyNote', () => {
  it('renders the exact note copy', () => {
    render(<StickyNote />);
    expect(screen.getByText(note)).toBeInTheDocument();
  });
});
