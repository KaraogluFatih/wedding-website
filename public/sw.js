self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Neue Bestellung', {
      body: data.body || '',
      icon: '/Rose-Right-Corner.png',
      badge: '/Rose-Right-Corner.png',
      data: { url: '/admin' },
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/admin')
  );
});
