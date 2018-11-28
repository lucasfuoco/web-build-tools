import {
    Declaration,
    Symbol,
    TypeChecker
} from 'typescript';
import { SyntaxKind } from 'typescript';
import { ApiDocumentation } from '../aedoc/api_documentation';
import { ReleaseTag } from '../aedoc/release_tag.types';
import { ExtractorContext } from '../index';
import { Markup } from '../markup/markup';
import { MarkupElement } from '../markup/markup_element';
import {
    AstItemKind,
    InitializationState,
    IAstItemOptions
} from './ast_item.types';
import { AstItemContainer } from './ast_item_container';

/**
 * AstItem is an abstract syntax tree base that represents the Tutorial definitions
 * such as the step description, step index, step name, code description.
 */
// tslint:disable-next-line:export-name
export abstract class AstItem {
    /** Name of API items should only contain letters, numbers and underscores. */
    private static _allowedNameRegex: RegExp = /^[a-zA-Z_]+[a-zA-Z_0-9]*$/;
    /** The name of the definition */
    public name: string;
    /** The name of an API item should be readable and not contain any special characters. */
    public supportedName: boolean;
    /** The type of definition represented by this AstItem instance */
    public kind: AstItemKind;
    /** A superset of memberItems and AstItems. */
    public innerItems: AstItem[];
    /** True if this AstItem or innerItems are missing tag information */
    public hasIncompleteTags: boolean;
    /**
     * List of extractor warnings that were reported using AstItem.reportWarning.
     */
    public warnings: string[];
    /** The parsed AEDoc comment for this item */
    public documentation: ApiDocumentation;
    /**
     * The release tag for this item, which may be inherited from a parent.
     * By contrast, ApiDocumentation.releaseTag merely tracks the release tag that was
     * explicitly applied to this item, and does not consider inheritance.
     */
    public inheritedReleaseTag: ReleaseTag = ReleaseTag.None;
    /**
     * The deprecated message for this item, which may be inherited from a parent.
     * By contrast, ApiDocumentation.deprecatedMessage merely tracks the message that was
     * explicitly applied to this item, and does not condider inheritance.
     */
    public inheritedDeprecatedMessage: MarkupElement[] = [];
    /**
     * Indicated that this AstItem does not have adequate AEDoc comments. If shouldHaveDocumentation()=true,
     * and there is less than 10 characters of summary text in the AEDoc, then this will be set to true and
     * noted in the API file produced by APIFileGenerator.
     * (The AEDoc text itself is not included in that report, because documentation
     * changes do not require an API review, and thus should not cause a diff for that report.)
     */
    public needsDocumentation: boolean;
    /** The ExtractorContext instance. */
    protected context: ExtractorContext;
    /**
     * Semantic information from the TypeScript Compiler API, corresponding to the symbol
     * that is seen by external consumers of the Public API.
    */
    protected exportSymbol: Symbol;
    /**
     * Semantic information from the Typescript Compiler API, corresponding to the place
     * where this object is originally defined.
     */
    protected declaration: Declaration;
    /**
     * Semantic information from the Typescript Compiler API, corresponding to the place
     * where this object is originally defined.
     */
    protected declarationSymbol: Symbol;
    protected typeChecker: TypeChecker;
    /**
     * Syntax information from the Typescript Compiler API, used to locate the file name
     * and line number when reporting an error for this AstItem
     */
    private _errorNode: Declaration;
    private _parentContainer: AstItemContainer | undefined;
    private _sourceFileText: string;
    /**
     * The state of this AstItems references. These references could include \@inheritdoc references
     * or type references.
     */
    private _state: InitializationState;

    constructor (options: IAstItemOptions) {
        this.reportError = this.reportError.bind(this);
        this.context = options.context;
        this.typeChecker = this.context.typeChecker;
        this.kind = AstItemKind.Default;
        this.innerItems = [];
        this.hasIncompleteTags = false;
        this.warnings = [];
        this.declaration = options.declaration;
        this.declarationSymbol = options.declarationSymbol;
        this.exportSymbol = options.exportSymbol || this.declarationSymbol;
        this.name = this.exportSymbol.name || '???';
        this.supportedName = false;
        this.needsDocumentation = false;
        this._errorNode = options.declaration;
        this._sourceFileText = options.sourceFileText || this.declaration.getSourceFile().text;
        this._state = InitializationState.Incomplete;

        this.documentation = new ApiDocumentation(
            this._sourceFileText,
            this.context.docItemLoader,
            this.context,
            this.reportError,
            this.warnings
        );
    }

    public notifyAddedToContainer (parentContainer: AstItemContainer): void {
        if (this._parentContainer) {
            throw new Error(`The API item has already been added to another container: ${this._parentContainer.name}`);
        }
        this._parentContainer = parentContainer;
    }

    /**
     * Determine if this AstItem and inner items are missing tag information
     */
    public hasAnyIncompleteTags (): boolean {
        if (this.hasIncompleteTags) {
            return true;
        }

        for (const innerItem of this.innerItems) {
            if (innerItem.hasAnyIncompleteTags()) {
                return true;
            }
        }
        return false;
    }

    /**
     * This function is a second stage that happens after ExtractorContext.analyze()
     * calls AstItem constructor to build up
     * the abstract syntax tree. In this second stage, we are creating the documentation for each AstItem.
     *
     * This function makes sure we create the documentation for each AstItem in the correct order.
     * In the event that a circular dependency occurs, an error is reported. For example, if AstItemOne
     * has an \@inheritdoc referencing AstItemTwo, and AstItemTwo has an \@inheritdoc referencing AstItemOne then
     * we have a circular dependency and an error will be reported.
     */
    public completeInitialization (): void {
        switch (this._state) {
            case InitializationState.Completed:
                return;
            case InitializationState.Incomplete:
                this._state = InitializationState.Completing;
                this.onCompleteInitialization();
                this._state = InitializationState.Completed;

                for (const innerItem of this.innerItems) {
                    innerItem.completeInitialization();
                }
                return;
            case InitializationState.Completing:
                this.reportError('circular reference');
                return;
            default:
                throw new Error('AstItem state is invalid');
        }
    }

    /**
     * Whether this APIItem should have documentation or not. If false then,
     * AstItem.missingDocumentation will never be set.
     */
    public shouldHaveDocumentation (): boolean {
        return true;
    }

    /** Return the compiler's underlying Declaration object */
    public getDeclaration (): Declaration {
        return this.declaration;
    }

    /** Called after the constructor to finish to analysis. */
    // tslint:disable-next-line:no-empty
    public visitTypeReferencesForAstItem (): void {

    }

    /**
     * Reports an error, adding the filename and line number information for
     * the declaration of this AstItem
     */
    protected reportError (message: string): void {
        this.context.reportError(message, this._errorNode.getSourceFile(), this._errorNode.getStart());
    }

    /**
     * Adds a warning to this AstItem.warnings list.
     */
    protected reportWarning (message: string): void {
        this.warnings.push(message);
    }

    /**
     * This method assumes all references from this AstItem have been resolved and we can now safely create
     * the documentation.
     */
    protected onCompleteInitialization (): void {
        this.documentation.completeInitialization(this.warnings);

        // Calculate the inherited release tag
        if (this.documentation.releaseTag !== ReleaseTag.None) {
            this.inheritedReleaseTag = this.documentation.releaseTag;
        } else if (this._parentContainer) {
            this.inheritedReleaseTag = this._parentContainer.inheritedReleaseTag;
        }

        // Calculate the inherited deprecation message
        if (this.documentation.deprecatedMessage.length) {
            this.inheritedDeprecatedMessage = this.documentation.deprecatedMessage;
        } else if (this._parentContainer) {
            this.inheritedDeprecatedMessage = this._parentContainer.inheritedDeprecatedMessage;
        }

        const summaryTextCondensed: string = Markup.extractTextContext(
            this.documentation.summary
        ).replace(/\s\s/g, ' ');
        this.needsDocumentation = this.shouldHaveDocumentation() && summaryTextCondensed.length <= 10;

        this.supportedName = (this.kind === AstItemKind.Package) || AstItem._allowedNameRegex.test(this.name);
        if (!this.supportedName) {
            this.warnings.push(`The name "${this.name}" contains unsupported characters; ` +
                'API names should use only letters, numbers and underscores');
        }

        if (this.kind === AstItemKind.Package) {
            if (this.documentation.releaseTag !== ReleaseTag.None) {
                const tag: string = '@' + ReleaseTag[this.documentation.releaseTag].toLowerCase();
                this.reportError(`The ${tag} tag is now allowed on the package, ` +
                `which is always considered to be @public`);
            }
        }

        if (this.documentation.preapproved) {
            if (!(this.getDeclaration().kind &&
                (SyntaxKind.InterfaceDeclaration || SyntaxKind.ClassDeclaration))) {
                this.reportError('The @preapproved tag may only be applied to classes and interfaces');
                this.documentation.preapproved = false;
            }
        }

        if (this.documentation.isDocInheritedDeprecated && this.documentation.deprecatedMessage.length === 0) {
            this.reportError('The @inheritdoc target has been marked as @deprecated.   ' +
                'Add a @deprecated message here, or else remove the @inheritdoc relationship.');
        }

        if (this.name.substr(0, 1) === '_') {
            if (this.documentation.releaseTag !== ReleaseTag.Internal
                && this.documentation.releaseTag !== ReleaseTag.None) {
                this.reportWarning('The underscore prefix ("_") should only be used with definitions'
                    + 'that are explicitly marked as @internal');
            }
        } else {
            if (this.documentation.releaseTag === ReleaseTag.Internal) {
                this.reportWarning('Because this definition is explicitly marked as @internal, ' +
                'an underscore prefix ("_") should be added to its name');
            }
        }

        // Is it missing a release tag?
        if (this.documentation.releaseTag === ReleaseTag.None) {
            // Only warn about top-level exports
            if (this._parentContainer && this._parentContainer.kind === AstItemKind.Package) {
                // Don't warn about items that failed to parse.
                if (!this.documentation.failedToParse) {
                    // If there is no release tag, and this is a top-level export of the package, then
                    // report an error
                    this.reportError(`A release tag (@alpha, @beta, @public, @internal) must be specified`
                        + `for ${this.name}`);
                }
            }
        }
    }
}