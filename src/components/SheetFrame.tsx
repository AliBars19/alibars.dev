import type { ReactNode } from 'react';
import type { SheetStyle } from '@/lib/pile';
import styles from './Sheet.module.css';

type SheetFrameProps = {
  id: string;
  style: SheetStyle;
  cv?: boolean;
  /** True while the title page covers the pile: makes a visible-but-covered
   * sheet (the CV, on first load) unreachable by keyboard/AT, per WCAG 2.4.3. */
  inert?: boolean;
  children: ReactNode;
};

/**
 * Positions one content sheet in the shared stage grid cell. Only mounts
 * children when the sheet is visible (top sheet, or mid-transition); every
 * other content sheet renders empty and hidden so the pile looks identical
 * no matter which sheet is on top, and hidden sheets have no focusable
 * descendants (they are simply not in the DOM). `tabIndex={-1}` lets a
 * programmatic focus() land on the container itself after a bring().
 */
export function SheetFrame({ id, style, cv, inert, children }: SheetFrameProps) {
  return (
    <article
      id={`sheet-${id}`}
      tabIndex={-1}
      aria-hidden={!style.visible || inert || undefined}
      inert={inert || undefined}
      className={`${styles.sheet} ${cv ? styles.cv : ''} ${style.visible ? '' : styles.hidden}`}
      style={{ zIndex: style.z, transform: style.transform, opacity: style.opacity }}
    >
      {style.visible ? children : null}
    </article>
  );
}
