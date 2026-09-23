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

  it('cleans up its timers and listeners on unmount without throwing', () => {
    const { result, unmount } = renderHook(() => usePile());
    act(() => {
      vi.advanceTimersByTime(120);
    });
    act(() => {
      result.current.pull();
    });
    expect(() => unmount()).not.toThrow();
  });
});
