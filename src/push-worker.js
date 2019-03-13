// This is a worker that only deals with push messages.
const workerStatus = {
  pageVisible: undefined
};

self.addEventListener('message', e => {
  // Update user online status.
  // We do not show push notifications if the page is visible
  // Pushes go through even if nobody is signed in... I believe that's the idea?
  if (e && e.data && typeof e.data.pageVisible === 'boolean') {
    workerStatus.pageVisible = e.data.pageVisible;

    console.log(`The user is focusing on me: ${workerStatus.pageVisible}`);
  }
});

self.addEventListener('push', event => {
  try {
    if (!workerStatus.pageVisible) {
      const pushData = event.data.json();
      const promiseChain = self.registration.showNotification(pushData.title, {
        body: pushData.body,
        icon: pushData.icon || undefined
      });
  
      event.waitUntil(promiseChain);
    } else {
      console.log('I am not displaying a push event because the user is already focusing on me. :3');
    }
  } catch (err) {
    console.log(`I failed at processing a push event: ${err} :(`);
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  const urlToOpen = new URL(self.location.origin);
  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontroller: true
  })
    .then(windows => windows.find(w => w.url === urlToOpen))
    .then(res => res ? res.focus() : clients.openWindow(urlToOpen));

  event.waitUntil(promiseChain);
});

self.addEventListener('install', () => {
  self.skipWaiting();
});