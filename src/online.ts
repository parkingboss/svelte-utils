import { readable } from 'svelte/store';

export const online = readable(window.navigator.onLine, set => {
  function onChange() {
    set(navigator.onLine);
  }

  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);

  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
});
