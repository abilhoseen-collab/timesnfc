// Captures UTM parameters from URL on first visit (sessionStorage) and tracks scroll depth.
let maxScroll = 0;
let scrollAttached = false;

export function readUTM() {
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
    };
    if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
      sessionStorage.setItem('lovable_utm', JSON.stringify(utm));
    }
    const stored = sessionStorage.getItem('lovable_utm');
    return stored ? JSON.parse(stored) : { utm_source: null, utm_medium: null, utm_campaign: null };
  } catch {
    return { utm_source: null, utm_medium: null, utm_campaign: null };
  }
}

export function attachScrollTracking(onMilestone: (pct: number) => void) {
  if (scrollAttached) return;
  scrollAttached = true;
  const milestones = [25, 50, 75, 100];
  const fired = new Set<number>();
  const handler = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    if (total <= 0) return;
    const pct = Math.min(100, Math.round((doc.scrollTop / total) * 100));
    if (pct > maxScroll) maxScroll = pct;
    for (const m of milestones) {
      if (pct >= m && !fired.has(m)) {
        fired.add(m);
        onMilestone(m);
      }
    }
  };
  window.addEventListener('scroll', handler, { passive: true });
}

export function getMaxScroll() {
  return maxScroll;
}
