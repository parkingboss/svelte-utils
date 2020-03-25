import { readable } from 'svelte/store';
import { gps } from '@parkingboss/utils';
import { Canceller } from './Canceller';

export const GPS_UNSTARTED = 'unstarted';
export const GPS_UNSUPPORTED = 'unsupported';
export const GPS_REQUESTING = 'requesting';
export const GPS_UNPERMITTED = 'unpermitted';
export const GPS_LOADING = 'loading';
export const GPS_ERROR = 'gps-error';
export const GPS_ACTIVE = 'active';

export type GpsStatus = typeof GPS_UNSTARTED | typeof GPS_UNSUPPORTED | typeof GPS_REQUESTING | typeof GPS_UNPERMITTED | typeof GPS_LOADING | typeof GPS_ERROR | typeof GPS_ACTIVE;

interface Geo {
  status: GpsStatus;
  position: Position | null;
  error: PositionError | null;
}

const DefaultGeo: Geo = { status: GPS_UNSTARTED, position: null, error: null };

export const geo = readable(DefaultGeo, set => {
  function setter(opts: Partial<Geo> = {}) {
    set(Object.assign(geo, opts));
  }

  let geo = DefaultGeo;

  if (!gps.available) {
    return setter({ status: GPS_UNSUPPORTED });
  }

  setter({ status: GPS_REQUESTING });

  let cancelled = false;
  let canceller: null | Canceller = null;
  gps.isPermitted({ enableHighAccuracy: false, maximumAge: Infinity, timeout: 20000 })
    .then(permitted => {
      if (cancelled) return;
      if (!permitted) {
        return setter({ status: GPS_UNPERMITTED });
      }
      canceller = gps.watch(position => setter({ status: GPS_ACTIVE, position, error: null  }), error => setter({ status: GPS_ERROR, error }));
    });

  return () => {
    cancelled = true;
    if (canceller) canceller();
  }
});
