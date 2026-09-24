import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CrumbifyCtas } from './CrumbifyCtas';

/**
 * Owner rule (fix round 4b): a CTA whose URL is still a TODO placeholder
 * must not render. Each case below overwrites the hoisted `@/content`
 * fixture so the "real URL shows the element" and "placeholder hides it"
 * paths are both exercised, independent of whatever real content.ts
 * currently has filled in.
 *
 * code-r7-01: the previous version of this file called
 * `vi.resetModules()` + `vi.doMock('@/content')` + a cold `await
 * import('./CrumbifyCtas')` inside every test, re-transforming and
 * re-evaluating the whole module graph each time. Under load that cold
 * import sometimes ran past the 5s test timeout; the late render then
 * landed in the DOM after the *next* test had already started, producing
 * "Found multiple elements with role link" failures in unrelated tests.
 * A single static import plus a mutable, `vi.hoisted`-created fixture
 * object removes the re-import entirely: the module is transformed once,
 * and each test only swaps the fixture's data before rendering.
 */
const fixture = vi.hoisted(() => ({
  crumbify: {
    ctas: [
      { label: 'Get it on the App Store ↗', href: 'https://apps.apple.com/app/crumbify/id123' },
      { label: 'View on GitHub', href: 'https://github.com/AliBars19/crumbify', icon: 'github' as const },
    ],
  },
}));

vi.mock('@/content', () => fixture);

describe('CrumbifyCtas', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders both CTAs when both hrefs are real URLs, and the GitHub CTA has its 20px icon', () => {
    fixture.crumbify.ctas = [
      { label: 'Get it on the App Store ↗', href: 'https://apps.apple.com/app/crumbify/id123' },
      { label: 'View on GitHub', href: 'https://github.com/AliBars19/crumbify', icon: 'github' as const },
    ];
    render(<CrumbifyCtas />);
    expect(screen.getByRole('link', { name: /Get it on the App Store/ })).toBeInTheDocument();
    const githubLink = screen.getByRole('link', { name: /View on GitHub/ });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink.querySelector('svg')).not.toBeNull();
  });

  it('renders the GitHub CTA with no icon when content.ts sets no icon field (code-r5-01)', () => {
    fixture.crumbify.ctas = [
      { label: 'Get it on the App Store ↗', href: 'https://apps.apple.com/app/crumbify/id123' },
      { label: 'View on GitHub', href: 'https://github.com/AliBars19/crumbify' },
    ];
    render(<CrumbifyCtas />);
    const githubLink = screen.getByRole('link', { name: /View on GitHub/ });
    expect(githubLink.querySelector('svg')).toBeNull();
  });

  it('hides only the App Store button when its href is still a TODO placeholder', () => {
    fixture.crumbify.ctas = [
      { label: 'Get it on the App Store ↗', href: '#TODO-crumbify-app-store' },
      { label: 'View on GitHub', href: 'https://github.com/AliBars19/crumbify', icon: 'github' as const },
    ];
    render(<CrumbifyCtas />);
    expect(screen.queryByRole('link', { name: /Get it on the App Store/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View on GitHub/ })).toBeInTheDocument();
  });

  it('hides only the GitHub button when its href is still a TODO placeholder', () => {
    fixture.crumbify.ctas = [
      { label: 'Get it on the App Store ↗', href: 'https://apps.apple.com/app/crumbify/id123' },
      { label: 'View on GitHub', href: '#TODO-crumbify-github', icon: 'github' as const },
    ];
    render(<CrumbifyCtas />);
    expect(screen.getByRole('link', { name: /Get it on the App Store/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /View on GitHub/ })).not.toBeInTheDocument();
  });

  it('renders no CTA row at all, and no leftover empty container, when both hrefs are still placeholders', () => {
    fixture.crumbify.ctas = [
      { label: 'Get it on the App Store ↗', href: '#TODO-crumbify-app-store' },
      { label: 'View on GitHub', href: '#TODO-crumbify-github', icon: 'github' as const },
    ];
    const { container } = render(<CrumbifyCtas />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });
});
