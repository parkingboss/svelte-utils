import { Items, Attachments, Payload } from '@parkingboss/api';
import { writable } from 'svelte/store';

export const items = writable<Items>({});
export const attachments = writable<Attachments>({});

function newer(curr: any, incoming: any) {
  if (!curr) return incoming;

  if (curr.updated && incoming.updated) return curr.updated > incoming.updated ? curr : incoming;
  if (curr.generated && incoming.generated) return curr.generated > incoming.generated ? curr : incoming;

  return incoming;
}

export function updateItems<T extends Payload>(result: T): T {
  items.update($items => {
    if (result.attachments) {
      attachments.update($attachments => {
        Object.entries(result.attachments!)
          .forEach(([key, incomingAttachments]) => {
            const currItem = $items[key];
            const incomingItem = result.items[key];
            const newerItem = newer(currItem, incomingItem);

            $attachments[key] = newerItem === currItem ? $attachments[key] : incomingAttachments;
          });

        return $attachments;
      });
    }

    Object.entries(result.items).forEach(([key, newItem]) => {
      $items[key] = newer($items[key], newItem);
    });

    return $items;
  });

  return result;
}
