// Web Push helpers — uses standard Web Push API + VAPID (no Firebase).
import { supabase } from '@/integrations/supabase/client';

// Public VAPID key — safe to expose to the browser.
const VAPID_PUBLIC_KEY =
  'BLplf6RasWj1udGzjh3XDdw52oc-c0BD8dULtDJI54Q6ZOjnHxE8DmBiSaNGfEyAErElZjYXyAYGkc_nsSxn5BY';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function bufToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return '';
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function pushPermission(): NotificationPermission {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    return reg || (await navigator.serviceWorker.ready);
  } catch {
    return null;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await getRegistration();
  if (!reg) return null;
  return reg.pushManager.getSubscription();
}

export async function subscribePush(): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false, error: 'Browser supports করে না' };

  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return { ok: false, error: 'Permission দেওয়া হয়নি' };

  const reg = await getRegistration();
  if (!reg) return { ok: false, error: 'Service worker খুঁজে পাওয়া যায়নি' };

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'লগইন করুন' };

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint: sub.endpoint,
      p256dh: bufToBase64(sub.getKey('p256dh')),
      auth: bufToBase64(sub.getKey('auth')),
      user_agent: navigator.userAgent.slice(0, 200),
      last_used_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,endpoint' }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function unsubscribePush(): Promise<{ ok: boolean; error?: string }> {
  const sub = await getCurrentSubscription();
  if (!sub) return { ok: true };
  const endpoint = sub.endpoint;
  await sub.unsubscribe();
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  return { ok: true };
}

export async function sendTestPush(): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('send-web-push', {
    body: { test: true },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: !!data?.success, error: data?.error };
}
