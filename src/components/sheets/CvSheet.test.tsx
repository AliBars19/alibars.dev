import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CvSheet } from './CvSheet';
import styles from './CvSheet.module.css';

const cssSource = readFileSync(join(process.cwd(), 'src/components/sheets/CvSheet.module.css'), 'utf-8');

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
    const racingHeading = screen.getByRole('link', { name: /Data Acquisition & Firmware Engineer/ });
    const entry = racingHeading.closest('li');
    expect(entry).not.toBeNull();
    const bullets = within(entry as HTMLElement).getAllByRole('listitem');
    expect(bullets).toHaveLength(2);
    expect(entry?.textContent).not.toContain('csg.racing');
  });

  it('experience highlight buttons call onOpen with the right sheet id', async () => {
    const onOpen = vi.fn();
    render(<CvSheet onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('link', { name: /Founder & Lead Engineer/ }));
    expect(onOpen).toHaveBeenCalledWith('crumbify');
    await userEvent.click(screen.getByRole('link', { name: /Data Acquisition & Firmware Engineer/ }));
    expect(onOpen).toHaveBeenCalledWith('racing');
    await userEvent.click(screen.getByRole('link', { name: /Video Automation Pipeline/ }));
    expect(onOpen).toHaveBeenCalledWith('video');
    await userEvent.click(screen.getByRole('link', { name: /motorsport/ }));
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

  it('project stack text sits as a sibling of the highlight span, not nested inside its 600/13.5px title span (slice-cv-01)', () => {
    render(<CvSheet onOpen={() => {}} />);
    const link = screen.getByRole('link', { name: /Video Automation Pipeline/ });
    const titleSpan = link.closest(`.${styles.entryTitle}`);
    expect(titleSpan).not.toBeNull();
    const stackSpan = screen.getByText(/\| Python, ffmpeg/);
    expect(stackSpan.className).toContain(styles.projectStack);
    expect(titleSpan?.contains(stackSpan)).toBe(false);
  });

  it('Compton Sixth Form: dates sit on the school row; the degree line stands alone with no right column (slice-cv-02)', () => {
    render(<CvSheet onOpen={() => {}} />);
    const school = screen.getByText('Compton Sixth Form');
    const schoolRow = school.closest(`.${styles.entryRow}`);
    expect(schoolRow).not.toBeNull();
    expect(schoolRow?.textContent).toContain('Sept. 2022');
    const degree = screen.getByText(/BTEC Applied Science/);
    expect(degree.closest(`.${styles.entryRow}`)).toBeNull();
  });

  it('footer highlight stays #1c1b19 (ink) at rest, on hover and on focus, not the muted footer text colour (slice-cv-04, regression for slice-cvcr4-01)', () => {
    // Matches `.footer a, .footer a:hover, .footer a:focus-visible {...}`
    // (specificity 0,2,1): round 3 added `.yellow:hover{color:inherit}`
    // (0,2,0) which outranked a bare `.footer a{color:var(--ink)}` (0,1,1)
    // on hover/focus, so the :hover/:focus-visible variants must be
    // present here too, not just the rest-state selector.
    const footerBlock = cssSource.match(
      /\.footer a,\s*\n?\s*\.footer a:hover,\s*\n?\s*\.footer a:focus-visible\s*{([^}]*)}/
    );
    expect(footerBlock).not.toBeNull();
    expect(footerBlock?.[1]).toMatch(/color:\s*var\(--ink\)/);
  });

  it('bullet and module lists use disc markers, not the inherited hollow circle (slice-cv-05)', () => {
    const bulletsBlock = cssSource.match(/\.bullets\s*{([^}]*)}/);
    const modulesBlock = cssSource.match(/\.modules\s*{([^}]*)}/);
    expect(bulletsBlock?.[1]).toMatch(/list-style-type:\s*disc/);
    expect(modulesBlock?.[1]).toMatch(/list-style-type:\s*disc/);
  });

  it('bold labels are 600-weight spans, not <strong> (700) (slice-cv-06)', () => {
    render(<CvSheet onOpen={() => {}} />);
    expect(document.querySelectorAll('strong')).toHaveLength(0);
    expect(screen.getByText('Relevant Modules:').tagName).toBe('SPAN');
    expect(screen.getByText('Languages:').tagName).toBe('SPAN');
  });
});
