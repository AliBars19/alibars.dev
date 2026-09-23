import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CvSheet } from './CvSheet';

describe('CvSheet', () => {
  it('renders every CV section', () => {
    render(<CvSheet onOpen={() => {}} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Ali Bars' })).toBeInTheDocument();
    expect(screen.getByText('Education')).toBeInTheDocument();
    expect(screen.getByText('Experience')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Technical Skills')).toBeInTheDocument();
  });

  it('has no phone number anywhere in the rendered CV', () => {
    render(<CvSheet onOpen={() => {}} />);
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/(\+?\d[\d\s-]{9,}\d)/);
  });

  it('has no em dash in any rendered text', () => {
    render(<CvSheet onOpen={() => {}} />);
    const text = document.body.textContent ?? '';
    expect(text).not.toContain('—');
  });

  it('the City Racing entry ends July 2026 and has exactly two bullets, with no csg.racing bullet', () => {
    render(<CvSheet onOpen={() => {}} />);
    expect(screen.getByText('Aug. 2025 – July 2026')).toBeInTheDocument();
    const racingHeading = screen.getByRole('button', { name: /Data Acquisition & Firmware Engineer/ });
    const entry = racingHeading.closest('li');
    expect(entry).not.toBeNull();
    const bullets = within(entry as HTMLElement).getAllByRole('listitem');
    expect(bullets).toHaveLength(2);
    expect(entry?.textContent).not.toContain('csg.racing');
  });

  it('experience highlight buttons call onOpen with the right sheet id', async () => {
    const onOpen = vi.fn();
    render(<CvSheet onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: /Founder & Lead Engineer/ }));
    expect(onOpen).toHaveBeenCalledWith('crumbify');
    await userEvent.click(screen.getByRole('button', { name: /Data Acquisition & Firmware Engineer/ }));
    expect(onOpen).toHaveBeenCalledWith('racing');
    await userEvent.click(screen.getByRole('button', { name: /Video Automation Pipeline/ }));
    expect(onOpen).toHaveBeenCalledWith('video');
    await userEvent.click(screen.getByRole('button', { name: /motorsport/ }));
    expect(onOpen).toHaveBeenCalledWith('about');
  });

  it('the Automated Publishing Platform project is an external link and never calls onOpen', () => {
    const onOpen = vi.fn();
    render(<CvSheet onOpen={onOpen} />);
    const link = screen.getByRole('link', { name: /Automated Publishing Platform/ });
    expect(link).toHaveAttribute('target', '_blank');
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('contact row has no phone entry and mailto/linkedin/github links', () => {
    render(<CvSheet onOpen={() => {}} />);
    expect(screen.getByRole('link', { name: 'alibars999@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:alibars999@gmail.com'
    );
    expect(screen.getByRole('link', { name: 'linkedin.com/in/alibars' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'github.com/AliBars19' })).toBeInTheDocument();
  });
});
