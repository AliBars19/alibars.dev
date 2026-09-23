import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Owner rule (fix round 4b): the Automated Publishing Platform entry keeps
 * its title and stack line even while its GitHub URL is still a TODO
 * placeholder, but the title itself renders as plain entry-title text (no
 * purple highlight, no GitHub icon, no trailing arrow, not a link) instead
 * of a dead link. Each fixture below mocks `@/content` so both the
 * "placeholder hides the link" and "real URL shows it" paths are exercised
 * independent of whatever content.ts currently has filled in.
 */
describe('CvProjects', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/content');
  });

  it('renders the external project title as plain text, not a link, while its href is a TODO placeholder', async () => {
    vi.doMock('@/content', () => ({
      cv: {
        projects: [
          {
            title: 'Automated Publishing Platform',
            href: '#TODO-automated-publishing-platform-github',
            highlight: 'purple',
            icon: 'github',
            stack: 'Next.js, TypeScript, OAuth',
            year: '2025',
            bullets: ['Schedules and publishes to TikTok and YouTube.'],
          },
        ],
      },
    }));
    const { CvProjects } = await import('./CvProjects');
    render(<CvProjects onOpen={vi.fn()} />);
    expect(screen.queryByRole('link', { name: /Automated Publishing Platform/ })).not.toBeInTheDocument();
    const title = screen.getByText('Automated Publishing Platform');
    expect(title.tagName).toBe('SPAN');
    // No GitHub icon (an <svg>) and no trailing arrow glyph.
    expect(title.querySelector('svg')).toBeNull();
    expect(title.textContent).toBe('Automated Publishing Platform');
    expect(screen.getByText(/Next\.js, TypeScript, OAuth/)).toBeInTheDocument();
  });

  it('renders the external project title as a purple link with the GitHub icon and arrow once a real URL is filled in', async () => {
    vi.doMock('@/content', () => ({
      cv: {
        projects: [
          {
            title: 'Automated Publishing Platform',
            href: 'https://github.com/AliBars19/publishing-platform',
            highlight: 'purple',
            icon: 'github',
            stack: 'Next.js, TypeScript, OAuth',
            year: '2025',
            bullets: ['Schedules and publishes to TikTok and YouTube.'],
          },
        ],
      },
    }));
    const { CvProjects } = await import('./CvProjects');
    render(<CvProjects onOpen={vi.fn()} />);
    const link = screen.getByRole('link', { name: /Automated Publishing Platform/ });
    expect(link).toHaveAttribute('href', 'https://github.com/AliBars19/publishing-platform');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.querySelector('svg')).not.toBeNull();
  });

  it('an internal project (opens a sheet) is unaffected by the placeholder check', async () => {
    const onOpen = vi.fn();
    vi.doMock('@/content', () => ({
      cv: {
        projects: [
          {
            title: 'Video Automation Pipeline',
            opens: 'video',
            highlight: 'yellow',
            stack: 'Python, ffmpeg',
            year: '2025',
            bullets: ['Batch pipeline.'],
          },
        ],
      },
    }));
    const { CvProjects } = await import('./CvProjects');
    render(<CvProjects onOpen={onOpen} />);
    const link = screen.getByRole('link', { name: /Video Automation Pipeline/ });
    expect(link).toBeInTheDocument();
  });
});
