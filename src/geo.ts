import { writable, Writable } from 'svelte/store';
import { readonly } from './readonly';
import { gps } from '@parkingboss/utils';

export const UNSTARTED = 'unstarted';
export const UNSUPPORTED = 'unsupported';
export const REQUESTING = 'requesting';
export const UNPERMITTED = 'unpermitted';
export const LOADING = 'loading';
export const GPS_ERROR = 'gps-error';
export const ACTIVE = 'active';

export type Status = typeof UNSTARTED | typeof UNSUPPORTED | typeof REQUESTING | typeof UNPERMITTED | typeof LOADING | typeof GPS_ERROR | typeof ACTIVE;

const $status: Writable<Status> = writable(UNSTARTED);
const $position: Writable<Position|null> = writable(null);
const $error: Writable<PositionError|null> = writable(null);

export const status = readonly($status);
export const position = readonly($position);
export const error = readonly($error);

type Canceller = () => void;
let stopWatchingGps: null | Canceller = null;

export async function start(opts: PositionOptions): Promise<void | Canceller> {
  if (stopWatchingGps) {
    return console.warn("You've already started the gps. This had no effect.");
  }

  if (!gps.available) return $status.set(UNSUPPORTED);

  $status.set(REQUESTING);

  if (!await gps.isPermitted({ enableHighAccuracy: false, maximumAge: Infinity, timeout: 20000 })) return $status.set(UNPERMITTED);

  $status.set(LOADING);

  function setPosition(pos: Position) {
    $status.set(ACTIVE);
    $position.set(pos);
    $error.set(null);
  }

  function setError(err: PositionError) {
    $status.set(GPS_ERROR);
    $error.set(err);
  }

  stopWatchingGps = gps.watch(setPosition, setError, opts);

  return stop;
}

export async function stop() {
  if (!stopWatchingGps) {
    return console.warn("You're not running gps. This call to stop had no effect.");
  }

  stopWatchingGps();
}
