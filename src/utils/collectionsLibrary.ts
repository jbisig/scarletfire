import type {
  Collection,
  LibraryCollectionEntry,
  SavedCollection,
} from '../types/collection.types';

export function duplicateCollectionName(name: string): string {
  return `${name.trimEnd()} (Copy)`;
}
