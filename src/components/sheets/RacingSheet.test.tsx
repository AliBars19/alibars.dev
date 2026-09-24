import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { racing } from '@/content';
import { imageSlotStyle } from '@/lib/imageSlot';
import { RacingSheet } from './RacingSheet';

const cssSource = readFileSync(join(process.cwd(), 'src/components/sheets/RacingSheet.module.css'), 'utf-8');

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

  it('reproduces the reference image-slot crop exactly via an absolutely positioned img, not object-position + scale (slice-rv-gps-crop-01)', () => {
    render(<RacingSheet onBack={() => {}} />);
    const img = screen.getByAltText('GPS lap trace overlaid on the FSUK circuit map');
    const { scale, x, y, naturalWidth, naturalHeight } = racing.gps.imageCrop;
    const expected = imageSlotStyle({ naturalWidth, naturalHeight }, { scale, x, y });
    expect(img).toHaveStyle({
      position: 'absolute',
      width: expected.width,
      height: expected.height,
      left: expected.left,
      top: expected.top,
      transform: expected.transform,
    });
    // The reference's literal reproduction: s:1.8 x:+18 y:+50 on the
    // 161x348 asset resolves to width 180%, left 68%, top 100% (see
    // src/lib/imageSlot.test.ts for the full derivation).
    expect(expected.width).toBe('180%');
    expect(expected.left).toBe('68%');
    expect(expected.top).toBe('100%');
  });

  it('back pill calls onBack', async () => {
    const onBack = vi.fn();
    render(<RacingSheet onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('telemetry/GPS paragraphs have text-wrap: pretty (slice-text-wrap-pretty-missing)', () => {
    const block = cssSource.match(/\.paragraph\s*{([^}]*)}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toMatch(/text-wrap:\s*pretty/);
  });

  it('the telemetry/GPS <strong> leads are styled at font-weight 600, not the UA-bold 700 (slice-r2-02)', () => {
    const block = cssSource.match(/\.paragraph strong\s*{([^}]*)}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toMatch(/font-weight:\s*600/);
  });
});
