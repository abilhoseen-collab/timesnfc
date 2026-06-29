// Lightweight A/B testing helper.
// - Deterministic per-visitor variant assignment (localStorage)
// - Logs assign + convert events to `ab_events` for analytics

import { supabase } from '@/integrations/supabase/client';

const STORAGE_PREFIX = 'lovable_ab__';
const SESSION_KEY = 'lovable_session_id';

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function pickVariant<T extends string>(variants: T[]): T {
  return variants[Math.floor(Math.random() * variants.length)];
}

export function getVariant<T extends string>(
  experimentKey: string,
  variants: T[],
  opts: { vcardId?: string | null } = {}
): T {
  if (typeof window === 'undefined') return variants[0];
  const key = STORAGE_PREFIX + experimentKey;
  const existing = localStorage.getItem(key) as T | null;
  if (existing && variants.includes(existing)) return existing;

  const variant = pickVariant(variants);
  localStorage.setItem(key, variant);

  // Fire-and-forget assign event
  supabase
    .from('ab_events')
    .insert({
      experiment_key: experimentKey,
      variant,
      event: 'assign',
      vcard_id: opts.vcardId ?? null,
      session_id: getSessionId(),
    })
    .then(() => {}, () => {});

  return variant;
}

export function trackConversion(
  experimentKey: string,
  opts: { vcardId?: string | null; metadata?: Record<string, unknown> } = {}
) {
  if (typeof window === 'undefined') return;
  const variant = localStorage.getItem(STORAGE_PREFIX + experimentKey);
  if (!variant) return;
  supabase
    .from('ab_events')
    .insert({
      experiment_key: experimentKey,
      variant,
      event: 'convert',
      vcard_id: opts.vcardId ?? null,
      session_id: getSessionId(),
      metadata: opts.metadata ?? null,
    })
    .then(() => {}, () => {});
}
