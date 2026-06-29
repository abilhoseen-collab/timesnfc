// Push notification service worker — imported by Workbox-generated sw.js
// Handles `push` events and notification clicks. Precaching is handled by Workbox.

self.addEventListener('push', (event) => {
  let payload = { title: 'নতুন নোটিফিকেশন', body: '', url: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/app-icon-192.png',
    badge: '/app-icon-192.png',
    data: { url: payload.url || '/' },
    tag: payload.tag || 'general',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.navigate(target).catch(() => {});
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
