import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { crumbify } from '@/content';
import { CrumbifySheet } from './CrumbifySheet';

const cssSource = readFileSync(join(process.cwd(), 'src/components/sheets/CrumbifySheet.module.css'), 'utf-8');

describe('CrumbifySheet', () => {
  it('renders the heading, screenshots and under-the-hood rows, and no em dash', () => {
    render(<CrumbifySheet onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Crumbify' })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('Under the hood')).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('—');
  });

  // The App Store and GitHub URLs are still TODO placeholders in
  // content.ts as of this round (owner hasn't supplied them yet), so per
  // the owner rule (fix round 4b) neither CTA renders. See
  // CrumbifyCtas.test.tsx for the "real URL shows the element" /
  // "placeholder hides it" fixtures, isolated from whatever content.ts
  // currently has filled in.
  it('renders no CTA row while both CTA URLs are still TODO placeholders', () => {
    render(<CrumbifySheet onBack={() => {}} />);
    expect(screen.queryByRole('link', { name: /Get it on the App Store/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View on GitHub/ })).not.toBeInTheDocument();
  });

  it('back pill calls onBack', async () => {
    const onBack = vi.fn();
    render(<CrumbifySheet onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('intro paragraph has text-wrap: pretty (slice-cr-01)', () => {
    const block = cssSource.match(/\.intro\s*{([^}]*)}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toMatch(/text-wrap:\s*pretty/);
  });

  it('under-the-hood row sentence span has text-wrap: pretty (slice-cr-02)', () => {
    render(<CrumbifySheet onBack={() => {}} />);
    const sentence = screen.getByText(crumbify.specs[0]?.v ?? '');
    expect(sentence.tagName).toBe('SPAN');
    const block = cssSource.match(/\.rowText\s*{([^}]*)}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toMatch(/text-wrap:\s*pretty/);
    expect(sentence.className).toContain('rowText');
  });

  it('the GitHub CTA reads its label and icon from content.ts instead of hardcoding them (slice-cvcr4-02 / code-r4-03)', () => {
    const ctasSource = readFileSync(join(process.cwd(), 'src/components/sheets/CrumbifyCtas.tsx'), 'utf-8');
    expect(ctasSource).not.toMatch(/>\s*View on GitHub\s*</);
    expect(ctasSource).toMatch(/github\.label/);
    expect(ctasSource).toMatch(/github\.icon/);
  });
});
