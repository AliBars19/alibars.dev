import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VideoSheet } from './VideoSheet';

const cssSource = readFileSync(join(process.cwd(), 'src/components/sheets/VideoSheet.module.css'), 'utf-8');

describe('VideoSheet', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/content');
  });

  it('renders the heading, stats and TikTok link, no em dash', () => {
    render(<VideoSheet onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Audio in, lyric video out.' })).toBeInTheDocument();
    expect(screen.getByText('60M+')).toBeInTheDocument();
    expect(screen.getByText('7.1M')).toBeInTheDocument();
    expect(screen.getByText('25K')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /@apollovaaa on TikTok/ })).toHaveAttribute(
      'href',
      'https://www.tiktok.com/@apollovaaa'
    );
    expect(document.body.textContent).not.toContain('—');
  });

  // The video pipeline GitHub URL is still a TODO placeholder in content.ts
  // as of this round, so per the owner rule (fix round 4b) the button does
  // not render.
  it('hides the "View the code on GitHub" button while its URL is still a TODO placeholder', () => {
    render(<VideoSheet onBack={() => {}} />);
    expect(screen.queryByRole('link', { name: /View the code on GitHub/ })).not.toBeInTheDocument();
  });

  it('shows the "View the code on GitHub" button once a real URL is filled in', async () => {
    vi.doMock('@/content', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/content')>();
      return {
        ...actual,
        video: {
          ...actual.video,
          cta: { label: 'View the code on GitHub', href: 'https://github.com/AliBars19/video-pipeline', icon: 'github' },
        },
      };
    });
    const { VideoSheet: MockedVideoSheet } = await import('./VideoSheet');
    render(<MockedVideoSheet onBack={() => {}} />);
    const link = screen.getByRole('link', { name: /View the code on GitHub/ });
    expect(link).toHaveAttribute('href', 'https://github.com/AliBars19/video-pipeline');
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('renders the GitHub CTA with no icon when content.ts sets no icon field (code-r5-01)', async () => {
    vi.doMock('@/content', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/content')>();
      return {
        ...actual,
        video: {
          ...actual.video,
          cta: { label: 'View the code on GitHub', href: 'https://github.com/AliBars19/video-pipeline' },
        },
      };
    });
    const { VideoSheet: MockedVideoSheet } = await import('./VideoSheet');
    render(<MockedVideoSheet onBack={() => {}} />);
    const link = screen.getByRole('link', { name: /View the code on GitHub/ });
    expect(link.querySelector('svg')).toBeNull();
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
});
