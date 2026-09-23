import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RacingSheet } from './RacingSheet';

describe('RacingSheet', () => {
  it('renders the heading, date, telemetry/GPS copy and the csg.racing link', () => {
    render(<RacingSheet onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'City Racing' })).toBeInTheDocument();
    expect(screen.getByText('Aug. 2025 – July 2026')).toBeInTheDocument();
    expect(screen.getByText('Live telemetry.')).toBeInTheDocument();
    expect(screen.getByText('GPS lap tool (C++).')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'csg.racing' });
    expect(link).toHaveAttribute('href', 'https://csg.racing');
    expect(document.body.textContent).not.toContain('—');
  });

  it('applies the reference GPS image crop (scale 1.8, x +18%, y +50%)', () => {
    render(<RacingSheet onBack={() => {}} />);
    const img = screen.getByAltText('GPS lap trace overlaid on the FSUK circuit map');
    expect(img).toHaveStyle({ transform: 'scale(1.8) translate(18%, 50%)' });
  });

  it('back pill calls onBack', async () => {
    const onBack = vi.fn();
    render(<RacingSheet onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
