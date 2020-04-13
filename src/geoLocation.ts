import { Api, Payload, PropertiesPayload } from '@parkingboss/api';
import { Polygon } from '@turf/helpers/lib/geojson';
import distance from '@turf/distance';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import buffer from '@turf/buffer';
import { geo } from './geo';
import { derived } from 'svelte/store';
import { updateItems } from './data';

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
      return await api.geoProperties(coords(pos), {}).then(p => updateItems(p));
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

    return Object.values(properties.properties.items)
    .map((p: any) => properties.items[p] || p)
    .map((p: any) => properties.items[p.address] || p.address)
    .map((a: any) => a.area as Polygon);

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

  return derived(geo, ({ position }, set) => {
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
