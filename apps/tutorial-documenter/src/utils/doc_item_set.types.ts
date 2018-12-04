import {DocItem} from './doc_item';

export interface IDocItemSetResolveResult {
  /** The match DocItem object, if found */
  docItem: DocItem | undefined;
  /** The closest matching parent DocItem, if any. */
  closestMatch: DocItem | undefined;
}