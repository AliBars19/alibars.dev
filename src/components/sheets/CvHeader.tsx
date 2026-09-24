import { cv } from '@/content';
import styles from './CvSheet.module.css';

export function CvHeader() {
  return (
    <header className={styles.header}>
      <h1 className={styles.name}>{cv.name}</h1>
      <p className={styles.tagline}>{cv.tagline}</p>
      <ul className={styles.contact}>
        {cv.contact.map((item) => (
          <li key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : item.label}</li>
        ))}
      </ul>
    </header>
  );
}
