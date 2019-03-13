import { getAccountPushSubscription, updateAccountPushSubscription } from './Gateway';
const publicKey = 'BDRe_PCCye4-n3Xcqpdad1O7U-g-XIqW7bdM_YpmRmHHH6-xFqi9-_OHypXtP7I7fFASiC5ucKyAsdkLfL7X_0k';

export function isServiceWorkerSupported () {
  return 'serviceWorker' in navigator;
}
export function isPageControlled () {
  return Boolean(isServiceWorkerSupported() && navigator.serviceWorker.controller);
}
export function isPushBlocked () {
  return Notification.permission === 'denied';
}
export function isPushAllowed () {
  return Notification.permission === 'granted';
}

export function updateWorker (pageVisible) {
  if (isPageControlled()) {
    navigator.serviceWorker.controller.postMessage({ pageVisible });
  }
}

export function getPushSubscription (registration) {
  return (registration ? Promise.resolve(registration) : navigator.serviceWorker.getRegistration()).then(reg => {
    return reg.pushManager.getSubscription().then(sub => {
      if (sub === null) {
        return Notification.requestPermission()
          .then(res => {
            if (res === 'granted') return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
            else return undefined;
          })
      } else return sub;
    })
    .catch(() => undefined);
  })
  .catch(() => undefined);
}

export function subscribeToPush (username, token) {
  // Every time that the service worker updates we get a new push subscription that has to be updated.
  return ((isServiceWorkerSupported() && isPushAllowed()) ? navigator.serviceWorker.ready : Promise.resolve())
    .then(() => getAccountPushSubscription(username, token))
    .then(res => {
      if (res) {
        // The user has a push subscription. We need to update it.
        return getPushSubscription()
          .then(sub => {
            if (sub) {
              return updateAccountPushSubscription(username, token, sub);
            }
          })
          .catch(() => undefined);
      }
    })
    .catch(() => undefined);
}

function urlBase64ToUint8Array(base64String) {
  // Thank you, https://gist.github.com/malko/ff77f0af005f684c44639e4061fa8019!
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+') //eslint-disable-line
    .replace(/_/g, '/')
  ;
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}