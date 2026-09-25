self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.message || data.body || 'Please proceed to your designated window.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200, 100, 400],
        tag: data.tag || 'bplo-ticket-notification',
        renotify: true,
        data: {
          url: data.url || '/'
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
          icon: '/favicon.ico'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
