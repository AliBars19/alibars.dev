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

  // behaviour-03: between 600 and 660px the rotated note corner would
  // otherwise sit over the CV's GitHub contact link; a media query nudges
  // it clear there while the desktop position (top:-22px; right:28px) stays
  // unchanged at 661px and above.
  it('CSS nudges the note position for the 600-660px range where it would overlap the GitHub link', () => {
    expect(cssSource).toMatch(/@media \(min-width: 600px\) and \(max-width: 660px\)\s*{\s*\.note\s*{/);
  });

  // round-7 regression (slice-r7-01 / slice-01 / behaviour-r7-01): the
  // 600-660px nudge must not also apply at 540-599px, where the mobile tab
  // row sits directly above .stage and would then paint over the note's
  // first text line. That band gets its own, smaller nudge instead.
  it('CSS uses a smaller, separate nudge for the 540-599px mobile-tab-row range', () => {
    expect(cssSource).toMatch(/@media \(min-width: 540px\) and \(max-width: 599px\)\s*{\s*\.note\s*{/);
  });
});
