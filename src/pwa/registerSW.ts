// Guarded service-worker registration wrapper.
// Only registers in production on the real published origin.
// In dev / Lovable preview / iframe / ?sw=off: unregisters any stale workers.

const SW_PATH = "/sw.js";

function isUnsafeContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (window.location.search.includes("sw=off")) return true;
  return false;
}

async function unregisterMatching() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs.map((r) => {
      const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
      if (url.endsWith(SW_PATH)) return r.unregister();
      return Promise.resolve();
    }),
  );
}

export async function registerSW(onUpdate?: () => void) {
  if (!("serviceWorker" in navigator)) return;
  if (isUnsafeContext()) {
    await unregisterMatching();
    return;
  }
  try {
    const { Workbox } = await import("workbox-window");
    const wb = new Workbox(SW_PATH);
    wb.addEventListener("waiting", () => {
      onUpdate?.();
    });
    wb.addEventListener("controlling", () => {
      window.location.reload();
    });
    await wb.register();
  } catch (err) {
    console.warn("[pwa] registration failed", err);
  }
}

export async function activateUpdate() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration(SW_PATH);
  if (reg?.waiting) {
    reg.waiting.postMessage({ type: "SKIP_WAITING" });
  }
}
