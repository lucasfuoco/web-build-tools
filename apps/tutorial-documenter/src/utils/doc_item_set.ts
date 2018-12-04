import {
    ApiJsonFile,
    IApiPackage,
    IApiItemReference
} from '@ossiaco/tutorial-extractor';
import {DocItem} from './doc_item';
import { IDocItemSetResolveResult } from './doc_item_set.types';
import {PackageName} from '@microsoft/node-core-library';

// tslint:disable-next-line:export-name
export class DocItemSet {
    public readonly docPackagesByName: Map<string, DocItem> = new Map<string, DocItem>();
    public readonly docPackages: DocItem[] = [];
    private _calculated: boolean;
    constructor () {
        this._calculated = false;
    }

    public loadApiJsonFile (apiJsonFileName: string): void {
        if (this._calculated) {
            throw new Error('calculatedReferences() was already called');
        }

        const apiPackage: IApiPackage = ApiJsonFile.loadFromFile(apiJsonFileName);
        const docItem: DocItem = new DocItem(apiPackage, apiPackage.name, this, undefined);
        this.docPackagesByName.set(apiPackage.name, docItem);
        this.docPackages.push(docItem);
    }

    public calculateReferences(): void {
        if (this._calculated) {
            return;
        }
        for (const docPackage of this.docPackages) {
            this._calculateReferences(docPackage);
        }
    }

    /**
     * Attempts to find the DocItem described by an IApiItemReference. If no match item is
     * found then undefined is returned.
     */
    public resolveApiItemReference(
        reference: IApiItemReference & {
            moreHierarchies?: string[];
        }
    ): IDocItemSetResolveResult {
        const result: IDocItemSetResolveResult = {
            docItem: undefined,
            closestMatch: undefined
        };
        const packageName: string = PackageName.combineParts(reference.scopeName, reference.packageName);
        let current: DocItem | undefined = undefined;

        for (const nameToMatch of [
            packageName, reference.exportName, reference.memberName,
            ...(reference.moreHierarchies || [])
        ]) {
            if (!nameToMatch) {
                // Success, since we ran out of stuff to match
                break;
            }

            // Is this the first time through the loop?
            if (!current) {
                // Yes, start with the package
                current = this.docPackagesByName.get(nameToMatch);
            } else {
                // No, walk the tree
                current = current.tryGetChild(nameToMatch);
            }

            if (!current) {
                return result;
            }

            result.closestMatch = current;
        }

        result.docItem = result.closestMatch;
        return result;
    }

    private _calculateReferences(docItem: DocItem): void {
        for (const child of docItem.children) {
            this._calculateReferences(child);
        }
    }
}