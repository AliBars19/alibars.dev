import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTheme } from './useTheme';

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-desk');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads the initial value from the data-desk attribute set by the pre-hydration script', () => {
    document.documentElement.setAttribute('data-desk', 'dark');
    const { result } = renderHook(() => useTheme());
    expect(result.current.dark).toBe(true);
    expect(result.current.label).toBe('Lights on');
  });

  it('defaults to light (label "Lights off") with no attribute set', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.dark).toBe(false);
    expect(result.current.label).toBe('Lights off');
  });

  it('toggle flips dark and persists to localStorage and the data-desk attribute', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggle();
    });
    expect(result.current.dark).toBe(true);
    expect(result.current.label).toBe('Lights on');
    expect(localStorage.getItem('alibars-desk')).toBe('dark');
    expect(document.documentElement.getAttribute('data-desk')).toBe('dark');

    act(() => {
      result.current.toggle();
    });
    expect(result.current.dark).toBe(false);
    expect(localStorage.getItem('alibars-desk')).toBe('light');
  });
});
