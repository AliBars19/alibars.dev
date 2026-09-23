import type { ReactNode } from 'react';
import type { SheetStyle } from '@/lib/pile';
import styles from './Sheet.module.css';

type SheetFrameProps = {
  id: string;
  style: SheetStyle;
  cv?: boolean;
  children: ReactNode;
};

/**
 * Positions one content sheet in the shared stage grid cell. Only mounts
 * children when the sheet is visible (top sheet, or mid-transition); every
 * other content sheet renders empty and hidden so the pile looks identical
 * no matter which sheet is on top, and hidden sheets have no focusable
 * descendants (they are simply not in the DOM).
 */
export function SheetFrame({ id, style, cv, children }: SheetFrameProps) {
  return (
    <article
      id={`sheet-${id}`}
      aria-hidden={!style.visible}
      className={`${styles.sheet} ${cv ? styles.cv : ''} ${style.visible ? '' : styles.hidden}`}
      style={{ zIndex: style.z, transform: style.transform }}
    >
      {style.visible ? children : null}
    </article>
  );
}
