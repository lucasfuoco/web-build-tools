import {
    ApiJsonFile,
    IApiPackage
} from '@ossiaco/tutorial-extractor';
import {DocItem} from './doc_item';

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

    private _calculateReferences(docItem: DocItem): void {
        for (const child of docItem.children) {
            this._calculateReferences(child);
        }
    }
}