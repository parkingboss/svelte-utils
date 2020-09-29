import { Items, Payload, Entity, Attachment, AttachmentItems, EntityItems } from '@parkingboss/api';
import { writable } from 'svelte/store';

export const items = writable<Items<Entity>>({});
export const attachments = writable<Items<Attachment>>({});

function newer(curr: any, incoming: any) {
  if (!curr) return incoming;

  if (curr.generated && incoming.generated) return curr.generated > incoming.generated ? curr : incoming;

  return incoming;
}

function updateAttachments(currentItems: EntityItems, newItems: EntityItems, newAttachments: AttachmentItems): void {
  if (Object.keys(newAttachments).length > 0) attachments.update(currentAttachments => {
    Object.entries(newAttachments).forEach(([itemId, newItemAttachments]) => {

      // which item is newer?
      const currItem = currentItems[itemId];
      const newItem = newItems[itemId];
      const newerItem = newer(currItem, newItems[itemId]) as Entity;

      // update attachments if incoming item is newer
      if (newerItem === newItem) {
        currentAttachments[itemId] = newItemAttachments;
      }
    });

    // return mutated currentAttachments object
    return currentAttachments;
  })
}

export function updateItems<T extends Payload>(payload: Partial<T>): T;
export function updateItems<T extends Payload>(...payloads: Partial<T>[]): T[];
export function updateItems<T extends Payload>(...payloads: Partial<T>[]) {

  // bundle up attachments adn items
  const allAttachments = payloads
    .filter(x => x.attachments)
    .map(p => p.attachments!.items || {} as AttachmentItems);
  const allItems = payloads.map(p => p.items as EntityItems);

  // unpack into combined items
  const newAttachments = Object.assign({}, ...allAttachments) as AttachmentItems;
  const newItems = Object.assign({}, ...allItems) as EntityItems;

  items.update($items => {

    updateAttachments($items, newItems, newAttachments);

    Object.entries(newItems).forEach(([itemId, newItem]) => {
      $items[itemId] = newer($items[itemId], newItem);
    });

    return $items;
  });

  return payloads.length == 1
    ? payloads[0]
    : payloads;
}
