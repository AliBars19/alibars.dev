import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SheetFrame } from './SheetFrame';

describe('SheetFrame', () => {
  it('mounts children and is not aria-hidden when visible', () => {
    render(
      <SheetFrame id="cv" style={{ transform: 'translate(0,0) rotate(-.4deg)', z: 10, visible: true }}>
        <p>content</p>
      </SheetFrame>
    );
    expect(screen.getByText('content')).toBeInTheDocument();
    expect(screen.getByText('content').closest('article')).not.toHaveAttribute('aria-hidden', 'true');
  });

  it('does not mount children and is aria-hidden when not visible', () => {
    render(
      <SheetFrame id="about" style={{ transform: 'translate(0,0) rotate(-.4deg)', z: 0, visible: false }}>
        <p>content</p>
      </SheetFrame>
    );
    expect(screen.queryByText('content')).not.toBeInTheDocument();
    expect(document.getElementById('sheet-about')).toHaveAttribute('aria-hidden', 'true');
  });
});
