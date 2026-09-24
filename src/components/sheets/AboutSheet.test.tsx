import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AboutSheet } from './AboutSheet';

const cssSource = readFileSync(join(process.cwd(), 'src/components/sheets/AboutSheet.module.css'), 'utf-8');

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

  it('body paragraph has text-wrap: pretty (slice-text-wrap-pretty-missing)', () => {
    const block = cssSource.match(/\.body\s*{([^}]*)}/);
    expect(block).not.toBeNull();
    expect(block?.[1]).toMatch(/text-wrap:\s*pretty/);
  });
});
