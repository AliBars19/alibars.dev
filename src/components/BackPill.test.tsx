import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BackPill } from './BackPill';

describe('BackPill', () => {
  it('renders "← back to CV" and calls onClick', async () => {
    const onClick = vi.fn();
    render(<BackPill onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
