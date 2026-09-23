import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BackPill } from './BackPill';

const cssSource = readFileSync(join(process.cwd(), 'src/components/BackPill.module.css'), 'utf-8');

describe('BackPill', () => {
  it('renders "← back to CV" and calls onClick', async () => {
    const onClick = vi.fn();
    render(<BackPill onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: '← back to CV' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('has no background transition (slice-cr-03: hover background applies instantly, per spec)', () => {
    expect(cssSource).not.toMatch(/transition\s*:/);
  });

  it('reads its label from content.ts instead of hardcoding it (slice-cvcr4-02 / code-r4-03)', () => {
    const source = readFileSync(join(process.cwd(), 'src/components/BackPill.tsx'), 'utf-8');
    expect(source).not.toMatch(/['"]←\s*back to CV['"]/);
    expect(source).toMatch(/site\.backToCv/);
  });
});
