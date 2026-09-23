import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Desk } from './Desk';

describe('Desk', () => {
  it('renders the brand, a download CV link with the download attribute, and a theme toggle', () => {
    render(<Desk />);
    expect(screen.getByText('alibars.dev')).toBeInTheDocument();
    const download = screen.getByRole('link', { name: 'Download CV (PDF)' });
    expect(download).toHaveAttribute('href', '/Ali_Bars_CV.pdf');
    expect(download).toHaveAttribute('download');
  });

  it('theme toggle label flips between Lights off and Lights on on click', async () => {
    render(<Desk />);
    const toggle = screen.getByRole('button', { name: /Lights (off|on)/ });
    const initial = toggle.textContent;
    await userEvent.click(toggle);
    expect(toggle.textContent).not.toBe(initial);
  });
});
