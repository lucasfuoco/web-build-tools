import {ApiDocumentation} from '../../../tutorial-extractor/src/aedoc/api_documentation';
import {
    Token,
    Tokenizer,
    TokenType
} from '../aedoc/index';
import {IApiItemReference} from '../api/index';
import {
    Markup,
    MarkupBasicElement,
    MarkupElement,
    MarkupLinkTextElement
} from '../markup/index';
import { ResolvedApiItem } from '../resolved_api_item';
import {
    UtilApiDefinitionReference
} from '../utils/index';
import { IScopedPackageName } from './util_api_definition_reference';

export class UtilDocElementParser {
    /**
     * Used to validate the display text for an \@link tag.  The display text can contain any
     * characters except for certain AEDoc delimiters: "@", "|", "{", "}".
     * This RegExp matches the first bad character.
     * Example: "Microsoft's {spec}" --> "{"
    */
    private static _displayTextBadCharacterRegEx: RegExp = /[@|{}]/;

    /**
     * Matches a href reference. This is used to get an idea whether a given reference is for an href
     * or an API definition reference.
     *
     * For example, the following would be matched:
     * 'http://'
     * 'https://'
     *
     * The following would not be matched:
     * '@microsoft/sp-core-library:Guid.newGuid'
     * 'Guid.newGuid'
     * 'Guid'
   */
    private static _hrefRegEx: RegExp = /^[a-z]+:\/\//;
    /** Start sequence is '/**'. */
    private static _jsdocStartRegEx: RegExp = /^\s*\/\*\*+\s*/;
    private static _stepStartRegEx: RegExp = /@stepstart/;
    private static _stepEndRegEx: RegExp = /@stepend/;

    static parseInteger(documentation: ApiDocumentation, tokenizer: Tokenizer): number | null {
        let token: Token | undefined;
        let parsing = true;
        let parsedText: number | null = null;
        while (parsing) {
            token = tokenizer.peekToken();
            if (!token || !token.text.length) {
                parsing = false; // end stream
                break;
            }

            if (token.type === TokenType.BlockTag) {
                parsing = false;
            } else if (token.type === TokenType.InlineTag) {
                parsing = false;
            } else if (token.type === TokenType.Text) {
                tokenizer.getToken();
                parsedText = JSON.parse(token.text.trim());
                if (typeof parsedText !== 'number') {
                    documentation.reportError(`Cannot parse \'${token.text.trim()}\' of type \'${typeof parsedText}\'. It must be of type \'number\'`);
                }
                break;
            } else {
                documentation.reportError(`Unidentifiable Token ${token.type} ${token.tag} "${token.text}"`);
            }
        }
        return parsedText;
    }

    static parse(documentation: ApiDocumentation, tokenizer: Tokenizer): MarkupBasicElement[] {
        const markupElements: MarkupBasicElement[] = [];
        let parsing = true;
        let token: Token | undefined;

        while(parsing) {
            token = tokenizer.peekToken();
            if (!token) {
                parsing = false; // end of stream
                break;
            }

            if (token.type == TokenType.BlockTag) {
                parsing = false;
            } else if (token.type === TokenType.InlineTag) {
                switch(token.tag) {
                    case '@inheritdoc':
                        tokenizer.getToken();
                        if (markupElements.length > 0 || documentation.summary.length > 0) {
                            documentation.reportError(
                                'A summary block is not allowed here, because the @inheritdoc target provides the summary'
                            );
                        }
                        documentation.incompleteInheritdocs.push(token);
                        documentation.isDocInherited = true;
                        break;
                    case '@link':
                        const linkMarkupElement: MarkupElement | undefined = this.parseLinkTag(documentation, token);
                        if (linkMarkupElement) {
                            // Push the linkMarkupElement to retain position in the documentation
                            markupElements.push(linkMarkupElement);
                            if (linkMarkupElement.kind === 'api-link') {
                                documentation.incompleteLinks.push(linkMarkupElement);
                            }
                        }
                        tokenizer.getToken();
                        break;
                    default:
                        parsing = false;
                        break;
                }
            } else if (token.type === TokenType.Text) {
                tokenizer.getToken();
                markupElements.push(...Markup.createTextParagraphs(token.text));
            } else {
                documentation.reportError(`Unidentifiable Token ${token.type} ${token.tag} "${token.text}"`);
            }
        }
        return markupElements;
    }

    static parseCode(documentation: ApiDocumentation, tokenizer: Tokenizer): MarkupElement[] {
        const markupElements: MarkupElement[] = [];
        let parsing = true;
        let token: Token | undefined;

        while (parsing) {
            token = tokenizer.peekToken();
            if (!token) {
                parsing = false; // end of stream
                break;
            }

            if (token.type == TokenType.BlockTag) {
                parsing = false;
            } else if (token.type === TokenType.InlineTag) {
                parsing = false;
            } else if (token.type === TokenType.Text) {
                tokenizer.getToken();
                markupElements.push(Markup.createCodeBox(token.text, 'javascript'));
            } else {
                documentation.reportError(`Unidentifiable Token ${token.type} ${token.tag} "${token.text}"`);
            }
        }

        return markupElements;
    }

    static parseAndNormalize(documentation: ApiDocumentation, tokenizer: Tokenizer): MarkupBasicElement[] {
        const markupElements: MarkupBasicElement[] = UtilDocElementParser.parse(documentation, tokenizer);
        Markup.normalize(markupElements);
        return markupElements;
    }

    /**
     * This method parses the semantic information in an \@link JSDoc tag, creates and returns a
     * MarkupElement with the corresponding information. If the corresponding inline tag \@link is
     * not formatted correctly an error will be reported and undefined is returned.
     *
     * The format for the \@link tag is {\@link URL or API defintion reference | display text}, where
     * the '|' is only needed if the optional display text is given.
     */
    static parseLinkTag(documentation: ApiDocumentation, tokenItem: Token): MarkupBasicElement | undefined {
        if (!tokenItem.text) {
            documentation.reportError('The {@link} tag must include a URL or API item reference');
            return undefined;
        }

        // Make sure there are no extra pipes
        const pipeSplitContent: string[] = tokenItem.text.split('|').map((value: string) => {
            return value ? value.trim() : value;
        });

        if (pipeSplitContent.length > 2) {
            documentation.reportError('The {@link} tag contains more than one pipe character ("|")');
            return undefined;
        }
        const addressPart: string = pipeSplitContent[0];
        const displayTextPart: string = pipeSplitContent.length > 1 ? pipeSplitContent[1] : '';

        let displayTextElements: MarkupLinkTextElement[];

        // If a display name is given, ensure it only contains characters for words.
        if (displayTextPart) {
            const match: RegExpExecArray | null = this._displayTextBadCharacterRegEx.exec(displayTextPart);
            if (match) {
                documentation.reportError(`The {@link} tag\'s display text contains an unsupported character: "${match[0]}"`);
                return undefined;
            }
            // Full match is valid text
            displayTextElements = Markup.createTextElements(displayTextPart);
        } else {
            // If the display text is not explicitly provided, then use the adress as the display text
            displayTextElements = Markup.createTextElements(addressPart);
        }

        // Try to guess if the tokenContent is a link or API definition reference
        let linkMarkupElement: MarkupBasicElement;
        if (this._hrefRegEx.test(addressPart)) {
            // Make sure only a single URL is given
            if (addressPart.indexOf(' ') >= 0) {
                documentation.reportError(
                    'The {@link} tag contains additional spaces after the URL;' +
                    ' if the URL contains spaces, encode them using %20; for display text, use a pipe delimiter ("|")'
                );
                return undefined;
            }
            linkMarkupElement = Markup.createWebLink(displayTextElements, addressPart);
        } else {
            // we are processing an API definition reference
            const apiDefinitionRef: UtilApiDefinitionReference | undefined = UtilApiDefinitionReference.createFromString(
                addressPart,
                documentation.reportError
            );

            // Once we can locate local API definitions, an error should be reported here if not found
            if (!apiDefinitionRef) {
                documentation.reportError('The {@link} tag API reference does not exist');
                return undefined;
            }

            const normalizedApiLink: IApiItemReference = apiDefinitionRef.toApiItemReference();
            if (!normalizedApiLink.packageName) {
                if (!documentation.context.packageName) {
                    throw new Error('Unable to resolve API reference without a package name');
                }

                // If the package name is unspecified, assume it is the current package
                const scopePackageName: IScopedPackageName = UtilApiDefinitionReference.parseScopedPackageName(
                    documentation.context.packageName
                );
                normalizedApiLink.scopeName = scopePackageName.scope;
                normalizedApiLink.packageName = scopePackageName.package;
            }

            linkMarkupElement = Markup.createApiLink(displayTextElements, normalizedApiLink);
        }
        return linkMarkupElement;
    }
    /**
     * This method parses the semantic information in an \@inheritdoc JSDoc tag and sets
     * all the relevant documentation properties from the inherited doc onto the documentation
     * of the current api item.
     */
    static parseInheritDoc(documentation: ApiDocumentation, token: Token, warnings: string[]): void {
        // Check to make sure the API definition reference is at most one string
        const tokenChunks: string[] = token.text.split(' ');
        if (tokenChunks.length > 1) {
            documentation.reportError('The {@inheritdoc} tag does not match the expected pattern' +
            ' "{@inheritdoc @scopeName/packageName:exportName}"');
            return;
        }

        // Create the IApiDefinitionReference object
        // Deconstruct the API reference expression 'scopeName/packageName:exportName.memberName'
        const apiDefinitionRef: UtilApiDefinitionReference | undefined = UtilApiDefinitionReference.createFromString(
            token.text,
            documentation.reportError
        );
        // if API reference expression is formatted incorrectly then apiDefinitionRef will be undefined
        if (!apiDefinitionRef) {
            documentation.reportError(`Incorrectly formatted API item reference: "${token.text}"`);
            return;
        }
        // Atempt to locate the apiDefinitionRef
        const resolvedAstItem: ResolvedApiItem | undefined = documentation.referenceResolver.resolver(
            apiDefinitionRef,
            documentation.context.package,
            warnings
        );

        // If no resolvedAstItem found then nothing to inherit
        // But for the time being set the summary to a text object
        if (!resolvedAstItem) {
            documentation.summary = Markup.createTextElements(`See documentation for ${tokenChunks[0]}`);
            return;
        }

        // We are going to copy the resolvedAstItem's documentation
        // We must make sure it's documentation can be completed,
        // if we cannot, an error will be reported via the documentation error handler.
        // This will only be a case our resolvedAstItem was created from a local
        // AstItem.
        if (resolvedAstItem.astItem) {
            resolvedAstItem.astItem.completeInitialization();
        }

        // inheritdoc found, copy over IApiBaseDefinition properties
        documentation.summary = resolvedAstItem.summary;
        documentation.remarks = resolvedAstItem.remarks;

        // Check if inheritdoc is deprecated
        // We need to check if this documentation has a deprecated message
        // but it may not appear until after this token.
        if (resolvedAstItem.deprecatedMessages && resolvedAstItem.deprecatedMessages.length > 0) {
            documentation.isDocInheritedDeprecated = true;
        }
    }
    /**
     * Extracts the steps of a tutorial file and returns them
     */
    static parseSteps(text: string, reportError: (message: string) => void): string[] {
        // Split on comments and code
        const lines = text.split(/(\/\*\*[\s\S]*?\*\/)/gm);
        if (!lines || (lines.length === 0) || !(UtilDocElementParser._jsdocStartRegEx.test(text))) {
            return [];
        }
        const steps: string[] = [];
        let step: string[] = [];
        let startMatch = false;
        let endMatch = true;

        for (let i = 0; i < lines.length; i++) {
            // If a @stepstart match
            if (UtilDocElementParser._stepStartRegEx.test(lines[i])) {
                // Add the item to the step array
                step.push(lines[i]);
                endMatch = false;
                startMatch = true;
                continue;
            }
            // If a @stepend match
            if (UtilDocElementParser._stepEndRegEx.test(lines[i])) {
                if (!startMatch) {
                    reportError('The {@stepend} tag must associate to a {@stepstart} tag');
                }
                // Add the last item to the step array
                step.push(lines[i]);
                // Join the step array as one item and add it to the steps container
                steps.push(step.join(''));
                // Reset the step array
                step = [];
                startMatch = false;
                endMatch = true;
                continue;
            }
            // If a @stepstart match
            if (startMatch) {
                // Add the child contents
                step.push(lines[i]);
            }
        }

        if (!endMatch) {
            reportError('The {@stepstart} tag must associate to a {@stepend} tag');
        }

        return steps;
    }
}