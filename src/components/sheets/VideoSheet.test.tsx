import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VideoSheet } from './VideoSheet';

const cssSource = readFileSync(join(process.cwd(), 'src/components/sheets/VideoSheet.module.css'), 'utf-8');

/**
 * code-r7-01: the previous version of this file mixed a static top-level
 * import of VideoSheet (used unmocked by the first tests) with, in two
 * later tests, `vi.doMock('@/content')` + a cold `await
 * import('./VideoSheet')`. That re-import re-transformed the module graph
 * inside the default 5s test timeout and, under load, occasionally missed
 * it; the late render then leaked into whichever test ran next. A single
 * static import plus a mutable `vi.hoisted` fixture (seeded with the real
 * content shape each test needs) removes the re-import entirely.
 */
const fixture = vi.hoisted(() => ({
  video: {
    date: '2025',
    title: 'Audio in, lyric video out.',
    sample: '/images/cv-video-sample.webp',
    stats: [
      { v: '60M+', l: 'views' },
      { v: '7.1M', l: 'likes' },
      { v: '25K', l: 'followers' },
    ],
    tiktok: { label: '@apollovaaa on TikTok ↗', href: 'https://www.tiktok.com/@apollovaaa' },
    body: [
      'A batch pipeline in Python.',
      'Finished videos go to a separate Next.js service that schedules and posts them to TikTok and YouTube.',
    ],
    cta: {
      label: 'View the code on GitHub',
      href: '#TODO-video-pipeline-github',
      icon: 'github' as 'github' | undefined,
    },
  },
}));

// BackPill (rendered by VideoSheet) reads `site` from the same module, so
// the mock keeps every other real export via importOriginal and overrides
// only `video` with the mutable fixture above.
vi.mock('@/content', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/content')>();
  return { ...actual, ...fixture };
});

describe('VideoSheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the heading, stats and TikTok link, no em dash', () => {
    fixture.video.cta = { label: 'View the code on GitHub', href: '#TODO-video-pipeline-github', icon: 'github' };
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
    fixture.video.cta = { label: 'View the code on GitHub', href: '#TODO-video-pipeline-github', icon: 'github' };
    render(<VideoSheet onBack={() => {}} />);
    expect(screen.queryByRole('link', { name: /View the code on GitHub/ })).not.toBeInTheDocument();
  });

  it('shows the "View the code on GitHub" button once a real URL is filled in', () => {
    fixture.video.cta = {
      label: 'View the code on GitHub',
      href: 'https://github.com/AliBars19/video-pipeline',
      icon: 'github',
    };
    render(<VideoSheet onBack={() => {}} />);
    const link = screen.getByRole('link', { name: /View the code on GitHub/ });
    expect(link).toHaveAttribute('href', 'https://github.com/AliBars19/video-pipeline');
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('renders the GitHub CTA with no icon when content.ts sets no icon field (code-r5-01)', () => {
    fixture.video.cta = {
      label: 'View the code on GitHub',
      href: 'https://github.com/AliBars19/video-pipeline',
      icon: undefined,
    };
    render(<VideoSheet onBack={() => {}} />);
    const link = screen.getByRole('link', { name: /View the code on GitHub/ });
    expect(link.querySelector('svg')).toBeNull();
  });

  it('back pill calls onBack', async () => {
    fixture.video.cta = { label: 'View the code on GitHub', href: '#TODO-video-pipeline-github', icon: 'github' };
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
