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

    await userEvent.keyboard(' ');
    expect(onDismiss).toHaveBeenCalledTimes(3);
  });

  it('is a div (not a <button>), so wrapping the <h1> is valid content and it stays exposed as a heading', () => {
    render(<TitlePage pulling={false} zIndex={26} onDismiss={() => {}} />);
    const control = screen.getByRole('button');
    expect(control.tagName).toBe('DIV');
    expect(control).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeInTheDocument();
  });

  it('wraps the heading/line/cta in a <div>, not a <span> (a span only allows phrasing content)', () => {
    render(<TitlePage pulling={false} zIndex={26} onDismiss={() => {}} />);
    const heading = screen.getByRole('heading', { level: 1, name: 'Ali Bars' });
    const body = heading.parentElement;
    expect(body?.tagName).toBe('DIV');
  });
});
