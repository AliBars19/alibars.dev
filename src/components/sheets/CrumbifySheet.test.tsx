import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CrumbifySheet } from './CrumbifySheet';

describe('CrumbifySheet', () => {
  it('renders the heading, CTAs, screenshots and under-the-hood rows, and no em dash', () => {
    render(<CrumbifySheet onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Crumbify' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Get it on the App Store/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View on GitHub/ })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(3);
    expect(screen.getByText('Under the hood')).toBeInTheDocument();
    expect(screen.getByText('App')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('—');
  });

  it('back pill calls onBack', async () => {
    const onBack = vi.fn();
    render(<CrumbifySheet onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
