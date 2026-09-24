/**
 * Owner rule (fix round 4b, docs/implementation-notes.md): any CTA or link
 * whose URL is still a TODO placeholder must not render at all (no dead
 * button/link), rather than rendering with a `#TODO-...` href.
 *
 * `src/content.ts` marks every URL Ali still needs to supply with a
 * `#TODO-...` hash (kept, not deleted, so `grep TODO` still finds every
 * placeholder). This is the single place that recognises that convention:
 * every component that conditionally renders a link/CTA calls this helper
 * instead of re-implementing the check, so replacing a TODO placeholder
 * with a real URL in content.ts makes the element reappear with no other
 * code change.
 */
export function isPlaceholderUrl(href: string | undefined | null): boolean {
  if (!href) return true;
  return href.includes('TODO');
}
