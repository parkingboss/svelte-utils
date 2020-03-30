import {  Writable } from 'svelte/store';

export function withArrayFns<T>(store: Writable<T[]>) {
  return Object.assign(store, {
    push(...args: T[]) {
      store.update((x: T[]) => {
        x.push(...args);
        return x;
      });
    },
    pop() {
      store.update((x: T[]) => {
        x.pop();
        return x;
      });
    },
    unshift(...args: T[]) {
      store.update((x: T[]) => {
        x.unshift(...args);
        return x;
      });
    },
    shift() {
      store.update((x: T[]) => {
        x.shift();
        return x;
      });
    },
    splice(start: number, deleteCount?: number, ...items: T[]): void {
      store.update((x: T[]) => {
        x.splice(start, deleteCount!, ...items);
        return x;
      });
    },
    removeIx(ix: number) {
      store.update((x: T[]) => {
        x.splice(ix, 1);
        return x;
      })
    }
  });
}
