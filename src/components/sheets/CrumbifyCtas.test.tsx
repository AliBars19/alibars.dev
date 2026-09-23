import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Owner rule (fix round 4b): a CTA whose URL is still a TODO placeholder
 * must not render. Each case below mocks `@/content` with a fixture so the
 * "real URL shows the element" and "placeholder hides it" paths are both
 * exercised, independent of whatever real content.ts currently has filled
 * in.
 */
describe('CrumbifyCtas', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('@/content');
  });

  it('renders both CTAs when both hrefs are real URLs', async () => {
    vi.doMock('@/content', () => ({
      crumbify: {
        ctas: [
          { label: 'Get it on the App Store ↗', href: 'https://apps.apple.com/app/crumbify/id123' },
          { label: 'View on GitHub', href: 'https://github.com/AliBars19/crumbify', icon: 'github' },
        ],
      },
    }));
    const { CrumbifyCtas } = await import('./CrumbifyCtas');
    render(<CrumbifyCtas />);
    expect(screen.getByRole('link', { name: /Get it on the App Store/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View on GitHub/ })).toBeInTheDocument();
  });

  it('hides only the App Store button when its href is still a TODO placeholder', async () => {
    vi.doMock('@/content', () => ({
      crumbify: {
        ctas: [
          { label: 'Get it on the App Store ↗', href: '#TODO-crumbify-app-store' },
          { label: 'View on GitHub', href: 'https://github.com/AliBars19/crumbify', icon: 'github' },
        ],
      },
    }));
    const { CrumbifyCtas } = await import('./CrumbifyCtas');
    render(<CrumbifyCtas />);
    expect(screen.queryByRole('link', { name: /Get it on the App Store/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View on GitHub/ })).toBeInTheDocument();
  });

  it('hides only the GitHub button when its href is still a TODO placeholder', async () => {
    vi.doMock('@/content', () => ({
      crumbify: {
        ctas: [
          { label: 'Get it on the App Store ↗', href: 'https://apps.apple.com/app/crumbify/id123' },
          { label: 'View on GitHub', href: '#TODO-crumbify-github', icon: 'github' },
        ],
      },
    }));
    const { CrumbifyCtas } = await import('./CrumbifyCtas');
    render(<CrumbifyCtas />);
    expect(screen.getByRole('link', { name: /Get it on the App Store/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View on GitHub/ })).not.toBeInTheDocument();
  });

  it('renders no CTA row at all, and no leftover empty container, when both hrefs are still placeholders', async () => {
    vi.doMock('@/content', () => ({
      crumbify: {
        ctas: [
          { label: 'Get it on the App Store ↗', href: '#TODO-crumbify-app-store' },
          { label: 'View on GitHub', href: '#TODO-crumbify-github', icon: 'github' },
        ],
      },
    }));
    const { CrumbifyCtas } = await import('./CrumbifyCtas');
    const { container } = render(<CrumbifyCtas />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });
});
