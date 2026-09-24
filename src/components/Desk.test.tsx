import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Desk } from './Desk';

const cssSource = readFileSync(join(process.cwd(), 'src/components/Desk.module.css'), 'utf-8');

describe('Desk', () => {
  it('renders the brand, a download CV link with the download attribute, and a theme toggle', () => {
    render(<Desk />);
    expect(screen.getByText('alibars.dev')).toBeInTheDocument();
    const download = screen.getByRole('link', { name: 'Download CV (PDF)' });
    expect(download).toHaveAttribute('href', '/Ali_Bars_CV.pdf');
    expect(download).toHaveAttribute('download');
  });

  // slice-gpi-04: both labels render unconditionally, and CSS keyed on
  // :root[data-desk] (not jsdom-applied here, so exercised via the source
  // check below and the e2e first-paint test) picks the visible one. That
  // means the toggle click updates the shared data-desk attribute, not the
  // component's own markup.
  it('renders both theme labels, and toggling flips the shared data-desk attribute on <html>', async () => {
    render(<Desk />);
    expect(screen.getByText('Lights off')).toBeInTheDocument();
    expect(screen.getByText('Lights on')).toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute('data-desk', 'dark');

    const toggle = screen.getByRole('button');
    await userEvent.click(toggle);
    expect(document.documentElement).toHaveAttribute('data-desk', 'dark');

    await userEvent.click(toggle);
    expect(document.documentElement).toHaveAttribute('data-desk', 'light');
  });

  it('CSS hides exactly one label per data-desk value, keyed off :root not component state', () => {
    expect(cssSource).toMatch(/:root\[data-desk=['"]dark['"]\]\)\s*\.labelLight\s*{\s*display:\s*none/);
    expect(cssSource).toMatch(/:root:not\(\[data-desk=['"]dark['"]\]\)\)\s*\.labelDark\s*{\s*display:\s*none/);
  });
});
