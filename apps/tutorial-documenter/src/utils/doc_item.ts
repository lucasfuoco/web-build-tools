import {ApiItem, IApiItemReference} from '@ossiaco/tutorial-extractor';
import {DocItemKind} from './doc_item.types';
import {DocItemSet} from './doc_item_set';
import {PackageName} from '@microsoft/node-core-library';

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
            case 'tutorial':
                this.kind = DocItemKind.Tutorial;
                for (const child of this.apiItem.children) {
                    this.children.push(new DocItem(child, '', this.docItemSet, this));
                }
                break;
            case 'step':
                this.kind = DocItemKind.Step;
                break;
            default:
                throw new Error('Unsupported item kind: ' + (this.apiItem as ApiItem).kind);
        }

        this.parent = parent;
    }

    /** Returns the parent chain in reverse order, i.e starting with the root of the tree */
    public getHierarchy(): DocItem[] {
        const result: DocItem[] = [];
        for (let current: DocItem | undefined = this; current; current = current.parent) {
            result.unshift(current);
        }
        return result;
    }

    public getApiReference(): IApiItemReference {
        const reference: IApiItemReference & {
            moreHierachies: string[];
        } = {
            scopeName: '',
            packageName: '',
            exportName: '',
            memberName: '',
            moreHierachies: []
        };
        let i: number = 0;
        for (const docItem of this.getHierarchy()) {
            switch (i) {
                case 0:
                    reference.scopeName = PackageName.getScope(docItem.name);
                    reference.packageName = PackageName.getUnscopedName(docItem.name);
                    break;
                case 1:
                    reference.exportName = docItem.name;
                    break;
                case 2:
                    reference.memberName = docItem.name;
                    break;
                default:
                    reference.moreHierachies.push(docItem.name);
                    break;
            }
            ++i;
        }
        return reference;
    }

    public tryGetChild(name: string): DocItem | undefined {
        for (const child of this.children) {
            if (child.name === name) {
                return child;
            }
        }
        return undefined;
    }
}