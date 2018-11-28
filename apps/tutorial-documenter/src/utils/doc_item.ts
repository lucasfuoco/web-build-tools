import {ApiItem} from '@ossiaco/tutorial-extractor';
import {DocItemKind} from './doc_item.types';
import {DocItemSet} from './doc_item_set';

// tslint:disable-next-line:export-name
export class DocItem {
    public readonly kind: DocItemKind;
    public readonly apiItem: ApiItem;
    public readonly name: string;
    public readonly docItemSet: DocItemSet;
    public readonly parent: DocItem | undefined;
    public readonly children: DocItem[];
    constructor(apiItem: ApiItem, name: string, docItemSet: DocItemSet, parent: DocItem | undefined) {
        this.apiItem = apiItem;
        this.name = name;
        this.docItemSet = docItemSet;
        this.children = [];

        switch (this.apiItem.kind) {
            case 'package':
                this.kind = this.apiItem.kind === 'package' ? DocItemKind.Package : DocItemKind.Default;
                for (const exportName of Object.keys(this.apiItem.exports)) {
                    const child: ApiItem = this.apiItem.exports[exportName];
                    this.children.push(new DocItem(child, exportName, this.docItemSet, this));
                }
                break;
            default:
                throw new Error('Unsupported item kind: ' + (this.apiItem as ApiItem).kind);
        }

        this.parent = parent;
    }
}