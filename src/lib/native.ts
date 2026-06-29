import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotifications } from '@capacitor/push-notifications';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

/** Native share with web fallback (handled by caller). Returns true if native handled. */
export async function nativeShare(opts: { title?: string; text?: string; url?: string }) {
  if (!isNative()) return false;
  try {
    await Share.share({
      title: opts.title,
      text: opts.text,
      url: opts.url,
      dialogTitle: opts.title,
    });
    return true;
  } catch {
    return false;
  }
}

/** Light haptic feedback on tap. No-op on web. */
export async function hapticTap() {
  if (!isNative()) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
}

/** Register for push notifications; resolves with device token (FCM/APNs) or null. */
export async function registerPush(): Promise<string | null> {
  if (!isNative()) return null;
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== 'granted') return null;
  await PushNotifications.register();
  return new Promise((resolve) => {
    const ok = PushNotifications.addListener('registration', (t) => {
      resolve(t.value);
      ok.then((l) => l.remove());
    });
    const err = PushNotifications.addListener('registrationError', () => {
      resolve(null);
      err.then((l) => l.remove());
    });
  });
}

/** Set up native shell once at app boot. Safe to call on web (no-op). */
export async function initNativeShell() {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#0b0218' });
  } catch {}

  // Hardware back button (Android) — let router handle, exit if at root
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back();
    else App.exitApp();
  });
}
