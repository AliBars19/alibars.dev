import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('renders 5 tab buttons and marks the active one with aria-current', () => {
    render(<Tabs top="racing" moving={null} onSelect={() => {}} variant="desktop" />);
    const cv = screen.getByRole('button', { name: 'cv' });
    const racing = screen.getByRole('button', { name: 'racing' });
    const video = screen.getByRole('button', { name: 'video bot' });
    expect(racing).toHaveAttribute('aria-current', 'page');
    expect(cv).not.toHaveAttribute('aria-current');
    expect(video).toBeInTheDocument();
  });

  it('calls onSelect with the sheet id when a tab is clicked', async () => {
    const onSelect = vi.fn();
    render(<Tabs top="cv" moving={null} onSelect={onSelect} variant="desktop" />);
    await userEvent.click(screen.getByRole('button', { name: 'crumbify' }));
    expect(onSelect).toHaveBeenCalledWith('crumbify');
  });

  it('fades out (opacity 0, no pointer events) while a move is in progress', () => {
    render(
      <Tabs top="cv" moving={{ k: 'about', prev: 'cv', stage: 'out' }} onSelect={() => {}} variant="desktop" />
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveStyle({ opacity: '0', pointerEvents: 'none' });
  });

  it('desktop variant drives the offset/active transform from CSS classes, never inline style', () => {
    render(<Tabs top="cv" moving={null} onSelect={() => {}} variant="desktop" />);
    const active = screen.getByRole('button', { name: 'cv' });
    const inactive = screen.getByRole('button', { name: 'racing' });
    expect(active.style.transform).toBe('');
    expect(inactive.style.transform).toBe('');
    expect(active.className).toMatch(/active/);
    expect(inactive.className).not.toMatch(/active/);
  });

  // slice-r7-02: text-transform: uppercase makes Chromium's accessibility
  // tree read the tab names as 'CV'/'VIDEO BOT'/etc (jsdom ignores CSS, so
  // it can't catch this); an explicit aria-label pins the accessible name
  // to the lower-case label from content.ts, matching the prototype.
  it('sets aria-label to the lower-case tab label, independent of the rendered text-transform', () => {
    render(<Tabs top="cv" moving={null} onSelect={() => {}} variant="desktop" />);
    expect(screen.getByRole('button', { name: 'cv' })).toHaveAttribute('aria-label', 'cv');
    expect(screen.getByRole('button', { name: 'video bot' })).toHaveAttribute('aria-label', 'video bot');
  });

  it('mobile variant renders a data-variant="mobile" row with no inline transform on any tab', () => {
    render(<Tabs top="cv" moving={null} onSelect={() => {}} variant="mobile" />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('data-variant', 'mobile');
    for (const button of screen.getAllByRole('button')) {
      expect(button.style.transform).toBe('');
      expect(button.style.top).toBe('');
    }
  });
});
