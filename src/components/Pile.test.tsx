import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Pile } from './Pile';

function mockMatchMedia(reduced = false) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: reduced && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList
  );
}

describe('Pile', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
    mockMatchMedia();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('shows the title page during the intro and no tabs; dismissing it reveals the CV and tabs', () => {
    render(<Pile />);

    const titlePage = screen.getByRole('button', { name: /click to open/ });
    expect(within(titlePage).getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(120);
    });
    act(() => {
      fireEvent.click(titlePage);
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.queryByRole('button', { name: /click to open/ })).not.toBeInTheDocument();
    // Two <Tabs> instances (desktop + mobile) exist at once; see the note
    // in the sticky-note test below for why.
    expect(screen.getAllByRole('navigation')).toHaveLength(2);
    expect(document.title).toBe('Ali Bars');
  });

  it('a deep link opens that sheet directly with no intro, and the back pill returns to the CV', () => {
    window.history.replaceState(null, '', '/#crumbify');
    render(<Pile />);

    expect(screen.getByRole('heading', { level: 2, name: 'Crumbify' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /click to open/ })).not.toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    });
    act(() => {
      vi.advanceTimersByTime(960);
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeInTheDocument();
  });

  it('the sticky note shows on a fresh CV and disappears for good after the first navigation', () => {
    window.history.replaceState(null, '', '/#cv');
    render(<Pile />);

    expect(screen.getByText(/psst: click anything highlighted/)).toBeInTheDocument();

    // Two <Tabs> instances exist in the DOM at once (desktop, tucked inside
    // the stage's stacking context, and mobile, a flow sibling above it);
    // real browsers show only one per viewport width via CSS, so tests pick
    // the first match rather than relying on jsdom's unapplied stylesheets.
    const crumbifyTab = screen.getAllByRole('button', { name: 'crumbify' }).at(0);
    if (!crumbifyTab) throw new Error('expected a "crumbify" tab button');
    act(() => {
      fireEvent.click(crumbifyTab);
    });
    act(() => {
      vi.advanceTimersByTime(960);
    });
    const cvTab = screen.getAllByRole('button', { name: 'cv' }).at(0);
    if (!cvTab) throw new Error('expected a "cv" tab button');
    act(() => {
      fireEvent.click(cvTab);
    });
    act(() => {
      vi.advanceTimersByTime(960);
    });

    expect(screen.queryByText(/psst: click anything highlighted/)).not.toBeInTheDocument();
  });

  it('renders one desktop Tabs instance inside the stage (same stacking context as the sheets)', () => {
    window.history.replaceState(null, '', '/#cv');
    render(<Pile />);
    const desktopNav = document.querySelector('[data-variant="desktop"]');
    const stage = document.querySelector('.js-stage');
    expect(desktopNav).not.toBeNull();
    expect(stage).not.toBeNull();
    expect(desktopNav && stage?.contains(desktopNav)).toBe(true);
  });
});
