import { writable } from 'svelte/store';

export interface Item {
  id: string;
  generated?: string | Date;
  updated?: string | Date;
}

export type Items = Record<string, Item>;

export type TypeString = string; // TODO: elaborate on valid attachment types

export interface AttachmentSet {
  [childKey: string]: TypeString;
}

export type Attachments = Record<string, Item>;

export interface Payload {
  items: Items;
  attachments: Attachments;
}

export const items = writable<Items>({});
export const attachments = writable<Attachments>({});

function newer(curr: any, incoming: any) {
  if (!curr) return incoming;

  if (curr.updated && incoming.updated) return curr.updated > incoming.updated ? curr : incoming;
  if (curr.generated && incoming.generated) return curr.generated > incoming.generated ? curr : incoming;

  return incoming;
}

export function updateItems(result: Payload) {
  items.update($items => {

    attachments.update($attachments => {
      Object.entries(result.attachments)
        .forEach(([key, incomingAttachments]) => {
          const currItem = $items[key];
          const incomingItem = result.items[key];
          const newerItem = newer(currItem, incomingItem);

          $attachments[key] = newerItem === currItem ? $attachments[key] : incomingAttachments;
        });

      return $attachments;
    });

    Object.entries(result.items).forEach(([key, newItem]) => {
      $items[key] = newer($items[key], newItem);
    });

    return $items;
  });
}
