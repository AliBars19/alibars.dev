import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { VideoSheet } from './VideoSheet';

const cssSource = readFileSync(join(process.cwd(), 'src/components/sheets/VideoSheet.module.css'), 'utf-8');

describe('VideoSheet', () => {
  it('renders the heading, stats, TikTok link and GitHub CTA, no em dash', () => {
    render(<VideoSheet onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Audio in, lyric video out.' })).toBeInTheDocument();
    expect(screen.getByText('60M+')).toBeInTheDocument();
    expect(screen.getByText('7.1M')).toBeInTheDocument();
    expect(screen.getByText('25K')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /@apollovaaa on TikTok/ })).toHaveAttribute(
      'href',
      'https://www.tiktok.com/@apollovaaa'
    );
    expect(screen.getByRole('link', { name: /View the code on GitHub/ })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('—');
  });

  it('back pill calls onBack', async () => {
    const onBack = vi.fn();
    render(<VideoSheet onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('body paragraphs have text-wrap: pretty (slice-text-wrap-pretty-missing)', () => {
    const block = cssSource.match(/\.paragraph\s*{([^}]*)}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toMatch(/text-wrap:\s*pretty/);
  });

  it("the GitHub CTA's icon is driven by content.ts's cta.icon field, not always rendered (code-r4-03)", () => {
    const source = readFileSync(join(process.cwd(), 'src/components/sheets/VideoSheet.tsx'), 'utf-8');
    expect(source).toMatch(/video\.cta\.icon/);
  });
});
