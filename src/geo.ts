import { readable } from 'svelte/store';
import { gps } from '@parkingboss/utils';
import { Canceller } from './Canceller';

export const UNSTARTED = 'unstarted';
export const UNSUPPORTED = 'unsupported';
export const REQUESTING = 'requesting';
export const UNPERMITTED = 'unpermitted';
export const LOADING = 'loading';
export const ERROR = 'gps-error';
export const ACTIVE = 'active';

export type Status = typeof UNSTARTED | typeof UNSUPPORTED | typeof REQUESTING | typeof UNPERMITTED | typeof LOADING | typeof ERROR | typeof ACTIVE;

interface State {
  status: Status;
  position: Position | null;
  error: PositionError | null;
}

const DefaultGeo: State = { status: UNSTARTED, position: null, error: null };

export const geo = readable(DefaultGeo, set => {
  function setter(opts: Partial<State> = {}) {
    set(Object.assign(geo, opts));
  }

  let geo = DefaultGeo;

  if (!gps.available) {
    return setter({ status: UNSUPPORTED });
  }

  setter({ status: REQUESTING });

  let cancelled = false;
  let canceller: null | Canceller = null;
  gps.isPermitted({ enableHighAccuracy: false, maximumAge: Infinity, timeout: 20000 })
    .then(permitted => {
      if (cancelled) return;
      if (!permitted) {
        return setter({ status: UNPERMITTED });
      }
      canceller = gps.watch(position => setter({ status: ACTIVE, position, error: null  }), error => setter({ status: ERROR, error }));
    });

  return () => {
    cancelled = true;
    if (canceller) canceller();
  }
});
