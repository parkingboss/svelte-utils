import { Items, Attachments, Payload } from '@parkingboss/api';
import { writable } from 'svelte/store';

export const items = writable<Items>({});
export const attachments = writable<Attachments>({});

function newer(curr: any, incoming: any) {
  if (!curr) return incoming;

  if (curr.generated && incoming.generated) return curr.generated > incoming.generated ? curr : incoming;

  return incoming;
}

export function updateItems<T extends Payload>(payload: T): T;
export function updateItems<T extends Payload>(...payloads: T[]): T[];
export function updateItems<T extends Payload>(...payloads: T[]) {
  const allAttachments = payloads.filter(x => x.attachments).map(p => p.attachments as Attachments);
  const allItems = payloads.map(p => p.items);

  const newAttachments = Object.assign({}, ...allAttachments) as Attachments;
  const newItems = Object.assign({}, ...allItems) as Items;

  items.update($items => {
    if (newAttachments) {
      attachments.update($attachments => {
        Object.entries(newAttachments!)
          .forEach(([key, incomingAttachments]) => {
            const currItem = $items[key];
            const incomingItem = newItems[key];
            const newerItem = newer(currItem, incomingItem);

            $attachments[key] = newerItem === currItem ? $attachments[key] : incomingAttachments;
          });

        return $attachments;
      });
    }

    Object.entries(newItems).forEach(([key, newItem]) => {
      $items[key] = newer($items[key], newItem);
    });

    return $items;
  });

  return payloads.length == 1
    ? payloads[0]
    : payloads;
}
