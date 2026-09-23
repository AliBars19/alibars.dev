import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Highlight } from './Highlight';

describe('Highlight', () => {
  it('renders an internal highlight as a real button with a trailing arrow, and calls onOpen on click', async () => {
    const onOpen = vi.fn();
    render(
      <Highlight color="yellow" onOpen={onOpen}>
        Founder & Lead Engineer
      </Highlight>
    );
    const btn = screen.getByRole('button', { name: /Founder & Lead Engineer →/ });
    await userEvent.click(btn);
    expect(onOpen).toHaveBeenCalledTimes(1);
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
});
