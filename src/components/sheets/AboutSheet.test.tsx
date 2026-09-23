import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AboutSheet } from './AboutSheet';

describe('AboutSheet', () => {
  it('renders two polaroids with captions, chips, and a mailto contact link', () => {
    render(<AboutSheet onBack={() => {}} />);
    expect(screen.getByText('London, UK')).toBeInTheDocument();
    expect(screen.getByText('Paris, France')).toBeInTheDocument();
    expect(screen.getByText('motorsport / f1')).toBeInTheDocument();
    const mail = screen.getByRole('link', { name: 'alibars999@gmail.com' });
    expect(mail).toHaveAttribute('href', 'mailto:alibars999@gmail.com');
    expect(document.body.textContent).not.toContain('—');
  });

  it('back pill calls onBack', async () => {
    const onBack = vi.fn();
    render(<AboutSheet onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
