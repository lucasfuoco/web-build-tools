import { ReleaseTag } from './aedoc/release_tag.types';
import {AstItem} from './ast/ast_item';
import {AstItemKind} from './ast/ast_item.types';
import { MarkupBasicElement, MarkupElement } from './markup/markup_element';

/**
 * A class to abstract away the difference between an item from our public API that could be
 * represented by either an AstItem or an ApiItem that is retrieved from a JSON file.
 */
// tslint:disable-next-line:export-name
export class ResolvedApiItem {
    public kind: AstItemKind;
    public summary: MarkupElement[];
    public remarks: MarkupElement[];
    public deprecatedMessages: MarkupBasicElement[] | undefined;
    public isBeta: boolean;
    public releaseTag: ReleaseTag;
    public astItem: AstItem | undefined;
    /**
     * A function to abstract the construction of a ResolvedApiItem instance
     * from an AstItem
     */
    public static createFromAstItem(astItem: AstItem): ResolvedApiItem {
        return new ResolvedApiItem(
            astItem.kind,
            astItem.documentation.summary,
            astItem.documentation.remarks,
            astItem.documentation.deprecatedMessage,
            astItem.documentation.releaseTag === ReleaseTag.Beta,
            astItem.documentation.releaseTag,
            astItem
        );
    }

    private constructor(
        kind: AstItemKind,
        summary: MarkupElement[],
        remarks: MarkupElement[],
        deprecatedMessages: MarkupBasicElement[] | undefined,
        isBeta: boolean,
        releaseTag: ReleaseTag,
        astItem: AstItem | undefined
    ) {
        this.kind = kind;
        this.summary = summary;
        this.remarks = remarks;
        this.deprecatedMessages = deprecatedMessages;
        this.isBeta = isBeta;
        this.releaseTag = releaseTag;
        this.astItem = astItem;
    }
}