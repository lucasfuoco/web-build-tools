import { ExtractorContext } from '../extractor_context/extractor_context';
import {
    IMarkupApiLink,
    MarkupBasicElement,
    MarkupElement
} from '../markup/markup_element';
import { ResolvedApiItem } from '../resolved_api_item';
import {
    IApiDefinitionReferenceParts,
    UtilApiDefinitionReference
} from '../utils/util_api_definition_reference';
import { UtilDocElementParser } from '../utils/util_doc_element_parser';
import { IReferenceResolver } from './api_documentation.types';
import { ReleaseTag } from './release_tag.types';
import { Token, TokenType } from './token';
import { Tokenizer } from './tokenizer';

// tslint:disable-next-line:export-name
export class ApiDocumentation {
    /** Match AEDoc block tags and inline tags */
    public static readonly _aedocTagsRegex: RegExp = /{\s*@(\\{|\\}|[^{}])*}|(?:^|\s)(\@[a-z_]+)(?=\s|$)/gi;

    public static _allowedRegularAedocTags: string[] = [
        '@alpha',
        '@beta',
        '@internal',
        '@internalremarks',
        '@preapproved',
        '@public',
        '@deprecated',
        '@summary',
        '@remarks',
        '@tutorial',
        '@tutorialname',
        '@stepstart',
        '@stepend',
        '@stepindex',
        '@stepname',
        '@code',
        '@codedescription'
    ];

    public static _allowedInlineAedocTags: string[] = [
        '@inheritdoc',
        '@link'
    ];

    public originalAedocs: string;
    public failedToParse: boolean;
    public referenceResolver: IReferenceResolver;
    public context: ExtractorContext;
    public warnings: string[];
    // ---------------------------------------------------- //
    // DocCommentTokens that are parsed into Doc Elements
    // ---------------------------------------------------- //
    /**
     * A "release tag" is an AEDoc tag which indicates whether this definition
     * is considered Public API for third party developers, as well as its release
     * stage (alpha, beta, etc).
     */
    public releaseTag: ReleaseTag;
    public summary: MarkupElement[];
    public deprecatedMessage: MarkupBasicElement[];
    public remarks: MarkupElement[];
    /** The tutorial name. */
    public tutorialName: MarkupElement[];
    /** The step index */
    public stepIndex: number | undefined;
    /** The step name */
    public stepName: MarkupElement[];
    /** The code */
    public code: MarkupElement[];
    /** The code description */
    public codeDescription: MarkupBasicElement[];
    /**
     * True if the "\@preapproved" tag was specified.
     * Indicates that this internal API is exempt from further reviews.
     */
    public preapproved: boolean;
    /**
     * True if the "\@tutorial" tag was specified.
     * Indicates that this is a valid tutorial
     */
    public isTutorial: boolean;
    public isDocInheritedDeprecated: boolean;
    public isDocInherited: boolean;
    /**
   * A list of \@link elements to be post-processed after all basic documentation has been created
   * for all items in the project.  We save the processing for later because we need ReleaseTag
   * information before we can determine whether a link element is valid.
   * Example: If API item A has a \@link in its documentation to API item B, then B must not
   * have ReleaseTag.Internal.
   */
    public incompleteLinks: IMarkupApiLink[];
    /**
   * A list of 'Token' objects that have been recognized as \@inheritdoc tokens that will be processed
   * after the basic documentation for all API items is complete. We postpone the processing
   * because we need ReleaseTag information before we can determine whether an \@inheritdoc token
   * is valid.
   */
    public incompleteInheritdocs: Token[];

    public readonly reportError: (message: string) => void;

    constructor (
        originalAedoc: string,
        referenceResolver: IReferenceResolver,
        context: ExtractorContext,
        errorLogger: (message: string) => void,
        warnings: string[]
    ) {
        this.reportError = (message: string) => {
            errorLogger(message);
            this.failedToParse = true;
        };
        this.originalAedocs = originalAedoc;
        this.referenceResolver = referenceResolver;
        this.failedToParse = false;
        this.context = context;
        this.warnings = warnings;

        this.releaseTag = ReleaseTag.None;
        this.summary = [];
        this.deprecatedMessage = [];
        this.remarks = [];
        this.tutorialName = [];
        this.stepIndex = undefined;
        this.stepName = [];
        this.code = [];
        this.codeDescription = [];
        this.preapproved = false;
        this.isTutorial = false;
        this.isDocInheritedDeprecated = false;
        this.isDocInherited = false;

        this.incompleteInheritdocs = [];
        this.incompleteLinks = [];

        this._parseDocs();
    }

    /**
     * Executes the implementation details involved in completing the documentation initialization.
     */
    public completeInitialization (warnings: string[]): void {
        // Ensure links are valid
        this._completeLinks();
        // Ensure inheritdocs are valid
        this._completeInheritdocs(warnings);
    }

    protected _parseDocs (): void {
        const tokenizer: Tokenizer = new Tokenizer(this.originalAedocs, this.reportError);
        let parsing: boolean = true;

        let releaseTagCount: number = 0;
        let tutorialTagCount: number = 0;
        let tutorialnameTagCount: number = 0;
        let stepStartCount: number = 0;
        let stepEndCount: number = 0;
        let stepIndexCount: number = 0;

        while (parsing) {
            const token: Token | undefined = tokenizer.peekToken();
            if (!token) {
                parsing = false; // end of stream
                // Report error if @inheritdoc is deprecated but no @deprecated tag present here
                if (this.isDocInheritedDeprecated && this.deprecatedMessage.length === 0) {
                    // if the documentation inherits docs from a deprecated API item, then
                    // this documentation must either have a deprecated message or it must
                    // not use the @inheritdoc and copy+paste the documentation
                    this.reportError(`A deprecation message must be included after the @deprecated tag.`);
                }
                break;
            }

            if (token.type === TokenType.BlockTag) {
                switch (token.tag) {
                    case '@summary':
                        tokenizer.getToken();
                        this._checkInheritDocStatus(token.tag);
                        this.summary = UtilDocElementParser.parseAndNormalize(this, tokenizer);
                        break;
                    case '@remarks':
                        tokenizer.getToken();
                        this._checkInheritDocStatus(token.tag);
                        this.remarks = UtilDocElementParser.parseAndNormalize(this, tokenizer);
                        break;
                    case '@deprecated':
                        tokenizer.getToken();
                        this.deprecatedMessage = UtilDocElementParser.parseAndNormalize(this, tokenizer);
                        if (!this.deprecatedMessage || this.deprecatedMessage.length === 0) {
                            this.reportError(`deprecated description required after @deprecated AEDoc tag.`);
                        }
                        break;
                    case '@internalremarks':
                        // parse but discard
                        tokenizer.getToken();
                        UtilDocElementParser.parse(this, tokenizer);
                        break;
                    case '@public':
                        tokenizer.getToken();
                        this.releaseTag = ReleaseTag.Public;
                        ++releaseTagCount;
                        break;
                    case '@internal':
                        tokenizer.getToken();
                        this.releaseTag = ReleaseTag.Internal;
                        ++releaseTagCount;
                        break;
                    case '@alpha':
                        tokenizer.getToken();
                        this.releaseTag = ReleaseTag.Alpha;
                        ++releaseTagCount;
                        break;
                    case '@beta':
                        tokenizer.getToken();
                        this.releaseTag = ReleaseTag.Beta;
                        ++releaseTagCount;
                        break;
                    case '@preapproved':
                        tokenizer.getToken();
                        this.preapproved = true;
                        break;
                    case '@tutorial':
                        tokenizer.getToken();
                        this.isTutorial = true;
                        ++tutorialTagCount;
                        break;
                    case '@tutorialname':
                        tokenizer.getToken();
                        this.tutorialName = UtilDocElementParser.parseAndNormalize(this, tokenizer);
                        ++tutorialnameTagCount;
                        break;
                    case '@stepstart':
                        tokenizer.getToken();
                        ++stepStartCount;
                        break;
                    case '@stepend':
                        tokenizer.getToken();
                        ++stepEndCount;
                        break;
                    case '@stepindex':
                        tokenizer.getToken();
                        this.stepIndex = UtilDocElementParser.parseInteger(this, tokenizer);
                        ++stepIndexCount;
                        break;
                    case '@stepname':
                        tokenizer.getToken();
                        this.stepName = UtilDocElementParser.parseAndNormalize(this, tokenizer);
                        break;
                    case '@code':
                        tokenizer.getToken();
                        this.code = UtilDocElementParser.parseCode(this, tokenizer);
                        break;
                    case '@codedescription':
                        tokenizer.getToken();
                        this.codeDescription = UtilDocElementParser.parse(this, tokenizer);
                        break;
                    default:
                        tokenizer.getToken();
                        this._reportBadAedocTag(token);
                        break;
                }
            } else if (token.type === TokenType.InlineTag) {
                switch (token.tag) {
                    case '@inheritdoc':
                        UtilDocElementParser.parse(this, tokenizer);
                        break;
                    case '@link':
                        UtilDocElementParser.parse(this, tokenizer);
                        break;
                    default:
                        tokenizer.getToken();
                        this._reportBadAedocTag(token);
                        break;
                }
            } else if (token.type === TokenType.Text) {
                tokenizer.getToken();

                if (token.text.trim().length !== 0) {
                    // Shorten "This is too long text" to "This is..."
                    const MAX_LENGTH: number = 40;
                    let problemText: string = token.text.trim();
                    if (problemText.length > MAX_LENGTH) {
                        problemText = problemText.substr(0, MAX_LENGTH - 3).trim() + '...';
                    }
                    this.reportError(`Unexpected text in AEDoc comment: "${problemText}"`);
                }
            } else {
                tokenizer.getToken();
                // This would be a program bug
                this.reportError(`Unexpected token: ${token.type} ${token.tag} "${token.text}"`);
            }
        }

        if (releaseTagCount > 1) {
            this.reportError('More than one release tag (@alpha, @beta, etc) was specified');
        }

        if (tutorialTagCount > 1) {
            this.reportError('More than one tutorial tag (@tutorial) was specified');
        }

        if (tutorialnameTagCount > 1) {
            this.reportError('More than one tutorial name tag (@tutorialname) was specified');
        }

        if (stepStartCount > 1) {
            this.reportError('More than one step start tag (@stepstart) was specified');
        }

        if (stepEndCount > 1) {
            this.reportError('More than one step end tag (@stepend) was specified');
        }

        if (stepIndexCount > 1) {
            this.reportError('More than one step index tag (@stepindex) was specified');
        }

        if (this.preapproved && this.releaseTag !== ReleaseTag.Internal) {
            this.reportError('The @preapproved tag may only be applied to @internal definitions');
            this.preapproved = false;
        }
    }

    /**
     * A processing of linkDocElements that refer to an ApiDefinitionReference. This method
     * ensures that the reference is to an API item that is not 'Internal'
     */
    private _completeLinks (): void {
        for (; ;) {
            const codeLink: IMarkupApiLink | undefined = this.incompleteLinks.pop();
            if (!codeLink) {
                break;
            }

            const parts: IApiDefinitionReferenceParts = {
                scopeName: codeLink.target.scopeName,
                packageName: codeLink.target.packageName,
                exportName: codeLink.target.exportName,
                memberName: codeLink.target.memberName
            };

            const apiDefinitionRef: UtilApiDefinitionReference = UtilApiDefinitionReference.createFromParts(parts);
            const resolvedAstItem: ResolvedApiItem | undefined = this.referenceResolver.resolver(
                apiDefinitionRef,
                this.context.package,
                this.warnings
            );

            // If the apiDefinition can not be found the resolvedAstItem will be
            // undefined and an error will have been reported via this.reportError
            if (resolvedAstItem) {
                if (resolvedAstItem.releaseTag === ReleaseTag.Internal ||
                    resolvedAstItem.releaseTag === ReleaseTag.Alpha) {
                    this.reportError('The {@link} tag references an @internal or @alpha API item, '
                        + 'which will not appear in the generated documentation');
                }
            }
        }
    }

    /**
     * A processing of inheritdoc 'Tokens'. This processing occurs after we have created documentation
     * for all ApiItems.
     */
    private _completeInheritdocs (warnings: string[]): void {
        for (; ;) {
            const token: Token | undefined = this.incompleteInheritdocs.pop();
            if (!token) {
                break;
            }

            UtilDocElementParser.parseInheritDoc(this, token, warnings);
        }
    }

    private _reportBadAedocTag (token: Token): void {
        const supportsRegular: boolean = ApiDocumentation._allowedRegularAedocTags.indexOf(token.tag) >= 0;
        const supportsInline: boolean = ApiDocumentation._allowedInlineAedocTags.indexOf(token.tag) >= 0;

        if (!supportsRegular && !supportsInline) {
            this.reportError(`The JSDoc tag \"${token.tag}\" is not supported by AEDoc`);
            return;
        }

        if (token.type === TokenType.InlineTag && !supportsInline) {
            this.reportError(`The AEDoc tag \"${token.tag}\" ` +
            `must use the inline tag notation (i.e. with curly braces)`);
            return;
        }

        if (token.type === TokenType.BlockTag && !supportsRegular) {
            this.reportError(`The AEDoc tag \"${token.tag}\" must use the block tag notation (i.e. no curly braces)`);
            return;
        }

        this.reportError(`The AEDoc tag \"${token.tag}\" is not supported in this context`);
        return;
    }

    private _checkInheritDocStatus (aedocTag: string): void {
        if (this.isDocInherited) {
            this.reportError(`The ${aedocTag} tag may not be used ` +
            `because this state is provided by the @inheritdoc target`);
        }
    }
}