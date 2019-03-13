// LocalStorage wrapper. Essentially a DAO.
const ACCOUNT_STORAGE_ID = 'LOGGED_IN_ACCOUNT';
const TOKEN_STORAGE_ID = 'LOGGED_IN_ACCOUNT_TOKEN';
const EVENTS_STORAGE_ID = 'LOGGED_IN_ACCOUNT_EVENTS';

const EVENTS_STORAGE_MAX = 50;

export function isEnabled () {
  return 'localStorage' in window;
}

export function get(key) {
  return localStorage.getItem(key) || undefined;
}

export function set(key, value) {
  localStorage.setItem(key, value);
}

export function remove(key) {
  localStorage.removeItem(key);
}

export function clear() {
  localStorage.clear();
}

export function hasAccount() {
  return (get(ACCOUNT_STORAGE_ID) && get(TOKEN_STORAGE_ID));
}

export function getAccount() {
  return hasAccount()
    ? { account: get(ACCOUNT_STORAGE_ID), token: get(TOKEN_STORAGE_ID) }
    : undefined;
}

export function setAccount(account, token) {
  set(ACCOUNT_STORAGE_ID, account);
  set(TOKEN_STORAGE_ID, token);
}

export function clearAccount() {
  remove(ACCOUNT_STORAGE_ID);
  remove(TOKEN_STORAGE_ID);
}

export function getEvents() {
  return (get(EVENTS_STORAGE_ID))
    ? JSON.parse(get(EVENTS_STORAGE_ID))
    : [];
}

export function saveEvents(events) {
  // Verify that we do not store duplicates.
  const currentEvents = getEvents();
  const newEvents = events.filter(a => !currentEvents.find(b => b.event === a.event && b.timestamp === a.timestamp));

  set(EVENTS_STORAGE_ID, JSON.stringify(
    [...currentEvents, ...newEvents].slice(-EVENTS_STORAGE_MAX)
  ));
}

export function markEventsAsRead() {
  const eventsRead = getEvents();
  eventsRead.forEach(a => { delete a.isNew; });

  set(EVENTS_STORAGE_ID, JSON.stringify(eventsRead));
}
