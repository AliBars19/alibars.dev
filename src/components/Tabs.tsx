import { tabs as tabContent } from '@/content';
import type { MovingState, SheetId } from '@/lib/pile';
import styles from './Tabs.module.css';

type TabsVariant = 'desktop' | 'mobile';

type TabsProps = {
  top: SheetId;
  moving: MovingState;
  onSelect: (id: SheetId) => void;
  /** Only meaningful for the 'desktop' variant, which sits inside the stage's stacking context. */
  zIndex?: number;
  variant: TabsVariant;
  /**
   * Mobile-only: keeps the row mounted (so it reserves its layout height
   * from the first paint) but invisible and non-interactive while the
   * intro plays, so the pile does not jump when the row starts rendering
   * at phase 'done' (slice-rvat-02).
   */
  hidden?: boolean;
};

// Vertical position of each desktop tab, ported from the reference prototype.
const TAB_TOP_OFFSET = 48;
const TAB_PITCH = 120;

/**
 * Two DOM instances: .tabsDesktop and .tabsMobile in Tabs.module.css each
 * carry their own media query, so only one is ever visible per breakpoint.
 * The 'desktop' instance is a child of the stage grid so its z-index
 * competes with the sheets in the same stacking context (tucked under the
 * top sheet's edge); the 'mobile' instance stays a flow sibling above the
 * stage so it can push it down. Transforms are driven entirely by CSS
 * classes (`.active`, `:hover`), never inline styles, so hover/active
 * states aren't overridden by inline rules.
 */
export function Tabs({ top, moving, onSelect, zIndex, variant, hidden }: TabsProps) {
  const moving_ = moving !== null;
  const isDesktop = variant === 'desktop';
  const navClass = isDesktop ? styles.tabsDesktop : styles.tabsMobile;
  const tabClass = isDesktop ? styles.tab : styles.tabMobile;
  const opacity = hidden ? 0 : moving_ ? 0 : 1;

  return (
    <nav
      aria-label="Sheets"
      data-variant={variant}
      className={navClass}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      style={{ zIndex, opacity, pointerEvents: hidden || moving_ ? 'none' : 'auto' }}
    >
      {tabContent.map((tab, i) => {
        const active = top === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`${tabClass} ${active ? styles.active : ''}`}
            style={{
              top: isDesktop ? TAB_TOP_OFFSET + i * TAB_PITCH : undefined,
              background: tab.color,
              fontWeight: active ? 600 : 400,
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
