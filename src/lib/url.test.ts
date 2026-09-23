import { describe, expect, it } from 'vitest';
import { isPlaceholderUrl } from './url';

describe('isPlaceholderUrl', () => {
  it('treats a #TODO-... hash as a placeholder', () => {
    expect(isPlaceholderUrl('#TODO-crumbify-github')).toBe(true);
  });

  it('treats undefined and an empty string as placeholders', () => {
    expect(isPlaceholderUrl(undefined)).toBe(true);
    expect(isPlaceholderUrl('')).toBe(true);
  });

  it('treats null as a placeholder', () => {
    expect(isPlaceholderUrl(null)).toBe(true);
  });

  it('does not treat a real URL as a placeholder', () => {
    expect(isPlaceholderUrl('https://github.com/AliBars19/crumbify')).toBe(false);
  });

  it('does not treat a real URL that happens to contain the substring "todo" in a different case as a placeholder (case-sensitive on the TODO marker)', () => {
    expect(isPlaceholderUrl('https://example.com/todo-app')).toBe(false);
  });
});
