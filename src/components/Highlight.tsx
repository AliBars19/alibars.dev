import type { MouseEvent, ReactNode } from 'react';
import { hashForSheet, type SheetId } from '@/lib/pile';
import { GithubIcon } from './GithubIcon';
import styles from './Highlight.module.css';

type BaseProps = {
  color: 'yellow' | 'purple';
  children: ReactNode;
  icon?: 'github';
};

type InternalProps = BaseProps & { onOpen: () => void; opens: SheetId; href?: undefined };
type ExternalProps = BaseProps & { href: string; onOpen?: undefined; opens?: undefined };

export type HighlightProps = InternalProps | ExternalProps;

const arrow = (external: boolean) => (external ? ' ↗' : ' →');

/** A modified or non-primary click follows the real href instead of being intercepted, so middle-click, cmd/ctrl-click and "open in new tab" reach the sheet (cv-26 / behaviour-02). */
function isPlainLeftClick(e: MouseEvent<HTMLAnchorElement>): boolean {
  return !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0;
}

/**
 * Both variants render as an inline <a>, never a <button>: a button
 * computes to display:inline-block (UA default) regardless of the
 * `.highlight{display:inline}` rule, so wrapped text becomes a centred
 * block instead of wrapping inline like the rest of the paragraph
 * (slice-cvcr-02). An internal highlight's href names its real destination
 * sheet (`#crumbify` etc.), so middle-click, "open in new tab" and "copy
 * link address" all resolve to that sheet instead of a bare `#`.
 */
export function Highlight(props: HighlightProps) {
  const colorClass = props.color === 'yellow' ? styles.yellow : styles.purple;
  const external = 'href' in props && props.href !== undefined;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (external) return;
    if (!isPlainLeftClick(e)) return;
    e.preventDefault();
    (props as InternalProps).onOpen();
  };

  return (
    <a
      href={external ? (props as ExternalProps).href : hashForSheet((props as InternalProps).opens)}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      className={`${styles.highlight} ${colorClass}`}
    >
      {props.icon === 'github' ? <GithubIcon size={14} strokeWidth={2.2} /> : null}
      {props.children}
      {arrow(external)}
    </a>
  );
}
