import { AstItem } from './ast_item';
import { IAstItemOptions } from './ast_item.types';

// tslint:disable-next-line:export-name
export abstract class AstItemContainer extends AstItem {
    private _memberItems: Map<string, AstItem> = new Map<string, AstItem>();
    constructor (options: IAstItemOptions) {
        super(options);
    }

    /**
     * Find a member in the namespace by name and return it if found.
     */
    public getMemberItem (memberName: string): AstItem | undefined {
        return this._memberItems.get(memberName);
    }

    public visitTypeReferencesForAstItem (): void {
        super.visitTypeReferencesForAstItem();

        this._memberItems.forEach((astItem: AstItem) => {
            astItem.visitTypeReferencesForAstItem();
        });
    }

    /** Return a list of the child items for this container sorted alphabetically. */
    public getSortedMemberItems (): AstItem[] {
        const astItems: AstItem[] = [];
        this._memberItems.forEach((astItem: AstItem) => {
            astItems.push(astItem);
        });
        return astItems.sort((a: AstItem, b: AstItem) => a.name.localeCompare(b.name));
    }

    /** Add a child item to the container */
    protected addMemberItem (astItem: AstItem): void {
        if (astItem.hasAnyIncompleteTags()) {
            this.reportWarning(`${astItem.name} has incomplete tag information`);
        } else {
            this.innerItems.push(astItem);
            this._memberItems.set(astItem.name, astItem);
            astItem.notifyAddedToContainer(this);
        }
    }
}