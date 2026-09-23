import type { ReactNode } from 'react';
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

export function Highlight(props: HighlightProps) {
  const colorClass = props.color === 'yellow' ? styles.yellow : styles.purple;

  if ('href' in props && props.href !== undefined) {
    return (
      <a href={props.href} target="_blank" rel="noopener noreferrer" className={`${styles.highlight} ${colorClass}`}>
        {props.icon === 'github' ? <GithubIcon size={14} strokeWidth={2.2} /> : null}
        {props.children}
        {arrow(true)}
      </a>
    );
  }

  return (
    <button type="button" onClick={props.onOpen} className={`${styles.highlight} ${colorClass}`}>
      {props.children}
      {arrow(false)}
    </button>
  );
}
