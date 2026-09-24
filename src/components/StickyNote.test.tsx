import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { note } from '@/content';
import { StickyNote } from './StickyNote';

const cssSource = readFileSync(join(process.cwd(), 'src/components/StickyNote.module.css'), 'utf-8');

describe('StickyNote', () => {
  it('renders the exact note copy', () => {
    render(<StickyNote />);
    expect(screen.getByText(note)).toBeInTheDocument();
  });

  it('is a div, not a <p>, so no UA margin shifts it from the spec top:-22px', () => {
    render(<StickyNote />);
    expect(screen.getByText(note).tagName).toBe('DIV');
  });

  // behaviour-03: the note is a non-interactive hint (atn-27); it must never
  // take clicks meant for content underneath it, such as the CV's GitHub
  // contact link at narrow widths.
  it('CSS marks the note non-interactive to the pointer', () => {
    expect(cssSource).toMatch(/\.note\s*{[^}]*pointer-events:\s*none/);
  });

  // behaviour-03: between 560 and 640px the rotated note corner would
  // otherwise sit over the CV's GitHub contact link; a media query nudges
  // it clear there while the desktop position (top:-22px; right:28px) stays
  // unchanged at 661px and above.
  it('CSS nudges the note position for the 540-660px range where it would overlap the GitHub link', () => {
    expect(cssSource).toMatch(/@media \(min-width: 540px\) and \(max-width: 660px\)\s*{\s*\.note\s*{/);
  });
});
