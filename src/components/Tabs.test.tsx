import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from './Tabs';

describe('Tabs', () => {
  it('renders 5 tab buttons and marks the active one with aria-current', () => {
    render(<Tabs top="racing" moving={null} onSelect={() => {}} />);
    const cv = screen.getByRole('button', { name: 'cv' });
    const racing = screen.getByRole('button', { name: 'racing' });
    const video = screen.getByRole('button', { name: 'video bot' });
    expect(racing).toHaveAttribute('aria-current', 'page');
    expect(cv).not.toHaveAttribute('aria-current');
    expect(video).toBeInTheDocument();
  });

  it('calls onSelect with the sheet id when a tab is clicked', async () => {
    const onSelect = vi.fn();
    render(<Tabs top="cv" moving={null} onSelect={onSelect} />);
    await userEvent.click(screen.getByRole('button', { name: 'crumbify' }));
    expect(onSelect).toHaveBeenCalledWith('crumbify');
  });

  it('fades out (opacity 0, no pointer events) while a move is in progress', () => {
    render(<Tabs top="cv" moving={{ k: 'about', prev: 'cv', stage: 'out' }} onSelect={() => {}} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveStyle({ opacity: '0', pointerEvents: 'none' });
  });
});
