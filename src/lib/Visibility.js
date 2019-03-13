export const visibilityIds = {
  hiddenId: undefined,
  visibilityChange: undefined
};

if (typeof document.hidden !== "undefined") {
    visibilityIds.hiddenId = 'hidden';
    visibilityIds.visibilityChange = 'visibilitychange';
} else if (typeof document.msHidden !== "undefined") {
  visibilityIds.hiddenId = 'msHidden';
  visibilityIds.visibilityChange = 'msvisibilitychange';
} else if (typeof document.webkitHidden !== "undefined") {
  visibilityIds.hiddenId = 'webkitHidden';
  visibilityIds.visibilityChange = 'webkitvisibilitychange';
}