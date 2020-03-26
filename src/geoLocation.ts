import { Api, PropertiesPayload } from '@parkingboss/api';
import { Polygon } from '@turf/helpers/lib/geojson';
import distance from '@turf/distance';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import buffer from '@turf/buffer';
import { geo } from './geo';
import { derived } from 'svelte/store';

export function geoLocation(api: Api) {
  let lastChecked: Position | null = null;
  let checking = false;
  let normalize = !api.settings.skipNormalization;
  let propertiesHere: PropertiesPayload | null = null;

  async function checkPosition(pos: Position): Promise<undefined | PropertiesPayload> {
    checking = true;
    lastChecked = pos;
    normalize = !api.settings.skipNormalization;
    try {
      return await api.property(coords(pos).join(','), {}) as PropertiesPayload;
    } catch (err) {
      console.warn("Failed to fetch property for current location.");
    } finally {
      checking = false;
    }
  }

  function coords(pos: Position): [number, number] {
    return [pos.coords.longitude, pos.coords.latitude];
  }

  function outOfArea(pos: [number, number], area: Polygon, accuracy: number): boolean {
    const buffered = buffer(area, accuracy, { units: 'meters' });
    return booleanPointInPolygon(pos, buffered as any);
  }

  function areas(properties: any): Polygon[] {
    if (normalize) {
      return Object.values(properties.locations.items)
        .map((p: any) => p.address.area as Polygon);
    } else {
      return Object.keys(properties.addresses.items)
        .map(key => properties.items[key].area as Polygon);
    }
  }

  function outOfBounds(current: Position, property: PropertiesPayload): boolean {
    const coord = coords(current);
    const acc = current.coords.accuracy;

    return areas(property).some(area => outOfArea(coord, area, acc));
  }

  function movedTenMeters(curr: Position, prev: Position): boolean {
    return distance(coords(curr), coords(prev), { units: 'meters' }) >= 10;
  }

  function shouldCheck(previous: Position | null, current: Position) {
    if (checking) return false;
    if (previous == null) return true;

    if (propertiesHere) {
      return outOfBounds(current, propertiesHere);
    } else {
      return movedTenMeters(current, previous);
    }
  }

  return derived(geo, ({position}, set) => {
    if (position == null) return set(null);

    if (shouldCheck(lastChecked, position)) {
      checkPosition(position).then(newPos => {
        if (newPos !== undefined) {
          set(newPos);
        }
      });
    }
  }, null as PropertiesPayload | null);
}
