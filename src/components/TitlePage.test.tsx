import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TitlePage } from './TitlePage';

describe('TitlePage', () => {
  it('renders the kicker, name, line and cta, and is a real, keyboard-operable button', async () => {
    const onDismiss = vi.fn();
    render(<TitlePage pulling={false} zIndex={26} onDismiss={onDismiss} />);
    expect(screen.getByText('vol. 01')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeInTheDocument();
    expect(screen.getByText('My name is Ali, and I build things.')).toBeInTheDocument();
    expect(screen.getByText('click to open →')).toBeInTheDocument();

    const btn = screen.getByRole('button');
    await userEvent.click(btn);
    expect(onDismiss).toHaveBeenCalledTimes(1);

    btn.focus();
    await userEvent.keyboard('{Enter}');
    expect(onDismiss).toHaveBeenCalledTimes(2);
  });
});
