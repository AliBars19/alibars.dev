import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProjectHeader } from './ProjectHeader';

describe('ProjectHeader', () => {
  it('renders the back pill and an optional right-hand date', async () => {
    const onBack = vi.fn();
    render(<ProjectHeader date="Mar. 2026 – Present" onBack={onBack} />);
    expect(screen.getByText('Mar. 2026 – Present')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('omits the date span when none is given (About)', () => {
    render(<ProjectHeader onBack={() => {}} />);
    expect(screen.queryByText(/\d{4}/)).not.toBeInTheDocument();
  });
});
