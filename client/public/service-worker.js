self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.message || data.body || 'Please proceed to your designated window.',
        icon: '/pwa-icon-512.png',
        badge: '/pwa-icon-512.png',
        vibrate: [200, 100, 200, 100, 400],
        tag: data.tag || 'bplo-ticket-notification',
        renotify: true,
        silent: false,
        data: {
          url: data.url || '/tracker'
        }
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'BPLO Queuing System', options)
      );
    } catch (err) {
      // Fallback if not JSON
      event.waitUntil(
        self.registration.showNotification('BPLO Queuing System', {
          body: event.data.text(),
          icon: '/pwa-icon-512.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/tracker';

  // Try to focus an existing window instead of opening a new one
  // This prevents the PWA from doing a full reload
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If there's already an open window, focus it
      for (const client of clientList) {
        if (client.url.includes('/tracker') && 'focus' in client) {
          return client.focus();
        }
      }
      // No existing window found — open a new one
      return clients.openWindow(targetUrl);
    })
  );
});
