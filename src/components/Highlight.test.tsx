import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Highlight } from './Highlight';

const cssSource = readFileSync(join(process.cwd(), 'src/components/Highlight.module.css'), 'utf-8');

describe('Highlight', () => {
  it('renders an internal highlight as an inline link (not a button, which forces a centred block) and calls onOpen on click', async () => {
    const onOpen = vi.fn();
    render(
      <Highlight color="yellow" opens="crumbify" onOpen={onOpen}>
        Founder & Lead Engineer
      </Highlight>
    );
    const link = screen.getByRole('link', { name: /Founder & Lead Engineer →/ });
    expect(link.tagName).toBe('A');
    await userEvent.click(link);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('renders a real per-sheet href, not "#", so middle-click / open-in-new-tab / copy-link resolve to the target sheet (cv-26 / behaviour-02)', () => {
    render(
      <Highlight color="yellow" opens="racing" onOpen={vi.fn()}>
        City Racing
      </Highlight>
    );
    const link = screen.getByRole('link', { name: /City Racing →/ });
    expect(link).toHaveAttribute('href', '#racing');
  });

  it('does not intercept a modified or non-primary click, so it falls through to the real href', async () => {
    const onOpen = vi.fn();
    render(
      <Highlight color="yellow" opens="video" onOpen={onOpen}>
        Video bot
      </Highlight>
    );
    const link = screen.getByRole('link', { name: /Video bot →/ });
    fireEvent.click(link, { ctrlKey: true });
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('renders an external highlight as a link with target _blank, rel noopener noreferrer, and a trailing ↗', () => {
    render(
      <Highlight color="purple" href="https://github.com/example/repo">
        Automated Publishing Platform
      </Highlight>
    );
    const link = screen.getByRole('link', { name: /Automated Publishing Platform ↗/ });
    expect(link).toHaveAttribute('href', 'https://github.com/example/repo');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'));
  });

  it('keeps the purple highlight text colour inherited on hover, beating the global a:hover rule', () => {
    // Regression for slice-cv-03: `.purple:hover` must set color:inherit itself
    // (specificity 0,2,1) so it beats the global `a:hover{color:#8a5a00}` rule
    // (0,1,1); relying on `.highlight{color:inherit}` alone (0,1,0) loses.
    const hoverBlockMatch = cssSource.match(/\.purple:hover,\s*\n?\s*\.purple:focus-visible\s*{([^}]*)}/);
    expect(hoverBlockMatch).not.toBeNull();
    expect(hoverBlockMatch?.[1]).toMatch(/color:\s*inherit/);
  });
});
