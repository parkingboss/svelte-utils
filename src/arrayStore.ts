import {  Writable } from 'svelte/store';

export function withArrayFns<T>(store: Writable<T[]>) {
  return Object.assign(store, {
    push(...args: T[]) {
      store.update(x => {
        x.push(...args);
        return x;
      });
    },
    pop() {
      store.update(x => {
        x.pop();
        return x;
      });
    },
    unshift(...args: T[]) {
      store.update(x => {
        x.unshift(...args);
        return x;
      });
    },
    shift() {
      store.update(x => {
        x.shift();
        return x;
      });
    },
    splice(start: number, deleteCount?: number, ...items: T[]): void {
      store.update(x => {
        x.splice(start, deleteCount!, ...items);
        return x;
      });
    },
    removeIx(ix: number) {
      store.update(x => {
        x.splice(ix, 1);
        return x;
      })
    }
  });
}
