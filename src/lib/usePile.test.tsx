import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePile } from './usePile';

function setHash(hash: string) {
  window.location.hash = hash;
}

describe('usePile', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.history.replaceState(null, '', '/');
    window.matchMedia =
      window.matchMedia ??
      ((): MediaQueryList =>
        ({
          matches: false,
          media: '',
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList);
    vi.spyOn(window, 'matchMedia').mockImplementation(
      () =>
        ({
          matches: false,
          media: '',
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts at phase off, then push after 120ms, staying at top=cv', () => {
    const { result } = renderHook(() => usePile());
    expect(result.current.state.phase).toBe('off');
    expect(result.current.state.top).toBe('cv');

    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(result.current.state.phase).toBe('push');
  });

  it('pull only takes effect from the push phase', () => {
    const { result } = renderHook(() => usePile());
    act(() => {
      result.current.pull();
    });
    expect(result.current.state.phase).toBe('off');

    act(() => {
      vi.advanceTimersByTime(120);
    });
    act(() => {
      result.current.pull();
    });
    expect(result.current.state.phase).toBe('pull');
  });

  it('pull -> done after 1000ms', () => {
    const { result } = renderHook(() => usePile());
    act(() => {
      vi.advanceTimersByTime(120);
    });
    act(() => {
      result.current.pull();
    });
    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(result.current.state.phase).toBe('pull');
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.state.phase).toBe('done');
  });

  function finishIntro(result: { current: ReturnType<typeof usePile> }) {
    act(() => {
      vi.advanceTimersByTime(120);
    });
    act(() => {
      result.current.pull();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
  }

  it('bring() is guarded: no-op before intro done, while moving, or if already top', () => {
    const { result } = renderHook(() => usePile());
    act(() => {
      result.current.bring('crumbify');
    });
    expect(result.current.state.top).toBe('cv');
    expect(result.current.state.moving).toBeNull();

    finishIntro(result);

    act(() => {
      result.current.bring('cv');
    });
    expect(result.current.state.moving).toBeNull();

    act(() => {
      result.current.bring('crumbify');
    });
    expect(result.current.state.moving).toEqual({ k: 'crumbify', prev: 'cv', stage: 'out' });

    act(() => {
      result.current.bring('racing');
    });
    expect(result.current.state.moving).toEqual({ k: 'crumbify', prev: 'cv', stage: 'out' });
  });

  it('bring(): out -> in at 440ms -> settled top at 960ms', () => {
    const { result } = renderHook(() => usePile());
    finishIntro(result);

    act(() => {
      result.current.bring('crumbify');
    });
    expect(result.current.state.moving?.stage).toBe('out');

    act(() => {
      vi.advanceTimersByTime(440);
    });
    expect(result.current.state.moving).toEqual({ k: 'crumbify', prev: 'cv', stage: 'in' });
    expect(result.current.state.top).toBe('cv');

    act(() => {
      vi.advanceTimersByTime(520);
    });
    expect(result.current.state.moving).toBeNull();
    expect(result.current.state.top).toBe('crumbify');
  });

  it('Esc brings the CV to the top', () => {
    const { result } = renderHook(() => usePile());
    finishIntro(result);
    act(() => {
      result.current.bring('crumbify');
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('crumbify');

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    expect(result.current.state.moving?.k).toBe('cv');
    act(() => {
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('cv');
  });

  it('a deep-link hash skips the intro and opens that sheet directly', () => {
    setHash('#racing');
    const { result } = renderHook(() => usePile());
    expect(result.current.state.phase).toBe('done');
    expect(result.current.state.top).toBe('racing');
  });

  it('respects prefers-reduced-motion by skipping the intro slide entirely', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    );
    const { result } = renderHook(() => usePile());
    expect(result.current.state.phase).toBe('done');
  });

  it('touched flips to true on first bring() and never resets, even after returning to CV', () => {
    const { result } = renderHook(() => usePile());
    finishIntro(result);
    expect(result.current.state.touched).toBe(false);

    act(() => {
      result.current.bring('crumbify');
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.touched).toBe(true);

    act(() => {
      result.current.bring('cv');
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('cv');
    expect(result.current.state.touched).toBe(true);
  });

  it('cleans up its timers and listeners on unmount, leaving no pending timers', () => {
    const { result, unmount } = renderHook(() => usePile());
    act(() => {
      vi.advanceTimersByTime(120);
    });
    act(() => {
      result.current.pull();
    });
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    expect(() => unmount()).not.toThrow();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('a hashchange event (e.g. browser Back) brings the matching sheet to the top', () => {
    const { result } = renderHook(() => usePile());
    finishIntro(result);

    act(() => {
      window.location.hash = '#racing';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('racing');
  });

  it('a hashchange to an empty hash (e.g. Back to /) brings the CV to the top', () => {
    const { result } = renderHook(() => usePile());
    finishIntro(result);
    act(() => {
      result.current.bring('crumbify');
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('crumbify');

    act(() => {
      window.location.hash = '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('cv');
  });

  it('uses replaceState to normalise the load-time URL, then pushState for every later bring()', () => {
    setHash('#cv');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const { result } = renderHook(() => usePile());

    expect(result.current.state.phase).toBe('done');
    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(pushSpy).not.toHaveBeenCalled();

    act(() => {
      result.current.bring('crumbify');
      vi.advanceTimersByTime(960);
    });
    expect(pushSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledTimes(1);
  });

  it('an unknown hash plays the intro normally (does not skip to done)', () => {
    setHash('#bogus');
    const { result } = renderHook(() => usePile());
    expect(result.current.state.phase).toBe('off');
    expect(result.current.state.top).toBe('cv');
  });

  it('under reduced motion, bring() cross-fades in immediately (no "out" stage) and settles at 200ms', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList
    );
    const { result } = renderHook(() => usePile());
    expect(result.current.state.phase).toBe('done');

    act(() => {
      result.current.bring('crumbify');
    });
    // No 440ms-invisible "out" stage: the incoming sheet is opaque from the
    // very first tick.
    expect(result.current.state.moving).toEqual({ k: 'crumbify', prev: 'cv', stage: 'in' });
    expect(result.current.state.top).toBe('cv');

    act(() => {
      vi.advanceTimersByTime(199);
    });
    expect(result.current.state.moving).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.state.moving).toBeNull();
    expect(result.current.state.top).toBe('crumbify');
  });

  it('a hashchange (browser Back) that arrives mid-move is queued and replayed once the move settles', () => {
    const { result } = renderHook(() => usePile());
    finishIntro(result);

    act(() => {
      result.current.bring('crumbify');
    });
    expect(result.current.state.moving?.stage).toBe('out');

    // Back fires while the move to crumbify is still in flight: canBring()
    // would reject a direct bring(), so it must be queued instead of lost.
    act(() => {
      window.location.hash = '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(result.current.state.moving?.k).toBe('crumbify');

    act(() => {
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('crumbify');
    // The queued Back now replays automatically.
    act(() => {
      vi.advanceTimersByTime(960);
    });
    expect(result.current.state.top).toBe('cv');
  });

  it('does not push a spurious history entry for a move that settles only to immediately replay a queued Back', () => {
    const { result } = renderHook(() => usePile());
    finishIntro(result);
    const pushSpy = vi.spyOn(window.history, 'pushState');

    act(() => {
      result.current.bring('crumbify');
    });
    act(() => {
      window.location.hash = '';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    act(() => {
      vi.advanceTimersByTime(960);
    });
    // Only the queued Back's own eventual pushState (once it settles too),
    // never one for the crumbify sheet it never really stayed on.
    expect(pushSpy.mock.calls.every((call) => call[2] !== '/#crumbify')).toBe(true);
  });
});
