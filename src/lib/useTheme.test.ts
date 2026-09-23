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

  it('toggle flips the data-desk attribute from its current value and persists to localStorage', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggle();
    });
    expect(document.documentElement.getAttribute('data-desk')).toBe('dark');
    expect(localStorage.getItem('alibars-desk')).toBe('dark');

    act(() => {
      result.current.toggle();
    });
    expect(document.documentElement.getAttribute('data-desk')).toBe('light');
    expect(localStorage.getItem('alibars-desk')).toBe('light');
  });

  it('treats no attribute as light, so the first toggle turns the desk dark', () => {
    const { result } = renderHook(() => useTheme());
    act(() => {
      result.current.toggle();
    });
    expect(document.documentElement.getAttribute('data-desk')).toBe('dark');
  });

  it('still flips the desk when localStorage.setItem throws (e.g. blocked/full storage)', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    const { result } = renderHook(() => useTheme());

    expect(() => {
      act(() => {
        result.current.toggle();
      });
    }).not.toThrow();

    expect(document.documentElement.getAttribute('data-desk')).toBe('dark');
    setItemSpy.mockRestore();
  });
});
