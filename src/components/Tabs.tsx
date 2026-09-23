import { tabs as tabContent } from '@/content';
import type { MovingState, SheetId } from '@/lib/pile';
import styles from './Tabs.module.css';

type TabsProps = {
  top: SheetId;
  moving: MovingState;
  onSelect: (id: SheetId) => void;
  zIndex?: number;
};

export function Tabs({ top, moving, onSelect, zIndex }: TabsProps) {
  const moving_ = moving !== null;
  return (
    <nav
      aria-label="Sheets"
      className={`${styles.tabs} js-tabs`}
      style={{ zIndex, opacity: moving_ ? 0 : 1, pointerEvents: moving_ ? 'none' : 'auto' }}
    >
      {tabContent.map((tab, i) => {
        const active = top === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={styles.tab}
            style={{
              top: 48 + i * 120,
              background: tab.color,
              fontWeight: active ? 600 : 400,
              transform: active ? 'translateX(0)' : 'translateX(-6px)',
            }}
            aria-current={active ? 'page' : undefined}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
