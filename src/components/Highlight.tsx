import type { MouseEvent, ReactNode } from 'react';
import { GithubIcon } from './GithubIcon';
import styles from './Highlight.module.css';

type BaseProps = {
  color: 'yellow' | 'purple';
  children: ReactNode;
  icon?: 'github';
};

type InternalProps = BaseProps & { onOpen: () => void; href?: undefined };
type ExternalProps = BaseProps & { href: string; onOpen?: undefined };

export type HighlightProps = InternalProps | ExternalProps;

const arrow = (external: boolean) => (external ? ' ↗' : ' →');

/**
 * Both variants render as an inline <a>, never a <button>: a button
 * computes to display:inline-block (UA default) regardless of the
 * `.highlight{display:inline}` rule, so wrapped text becomes a centred
 * block instead of wrapping inline like the rest of the paragraph
 * (slice-cvcr-02). An internal highlight has no real destination, so its
 * href is just '#' and the click is fully intercepted.
 */
export function Highlight(props: HighlightProps) {
  const colorClass = props.color === 'yellow' ? styles.yellow : styles.purple;
  const external = 'href' in props && props.href !== undefined;

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (external) return;
    e.preventDefault();
    (props as InternalProps).onOpen();
  };

  return (
    <a
      href={external ? (props as ExternalProps).href : '#'}
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
