import { IApiItemReference } from '../api/index';
import {
    IMarkupCreateTextOptions,
    MarkupHighlighter
} from './markup.types';
import {
    IMarkupApiLink,
    IMarkupCodeBox,
    IMarkupParagraph,
    IMarkupText,
    IMarkupWebLink,
    MarkupBasicElement,
    MarkupElement,
    MarkupLinkTextElement,
    IMarkupPage,
    IMarkupNoteBox,
    IMarkupParagraphAndElements,
    IMarkupHtmlTag,
    IMarkupList,
    IMarkupListRow,
    IMarkupListCell,
    IMarkupSection
} from './markup_element';

// tslint:disable-next-line:export-name
export class Markup {

    /** A predefined constant for the IMarkupParagraph element. */
    public static PARAGRAPH: IMarkupParagraph = {
        kind: 'paragraph'
    };

    /** Contructs an IMarkupTable element with the specified title. */
    public static createPage(title?: string): IMarkupPage {
        return {
            kind: 'page',
            breadcrumb: [],
            title: title ? Markup._trimRawText(title) : undefined,
            elements: []
        } as IMarkupPage;
    }

    /**
     * Constructs an IMarkupText element representing the specified text string, with
     * optional formatting.
    */
    public static createTextElements(text: string, options?: IMarkupCreateTextOptions): IMarkupText[] {
        if (!text.length) {
            return [];
        }
        const result: IMarkupText = {
            kind: 'text',
            text: Markup._trimRawText(text)
        };

        if (options) {
            if (options.bold) {
                result.bold = true;
            }
            if (options.italics) {
                result.italics = true;
            }
        }
        return [result];
    }
    /**
     * Similar to Markup.createTextElements representing multi line text
     */
    public static createTextParagraphs(text: string, options?: IMarkupCreateTextOptions): MarkupBasicElement[] {
        const result: MarkupBasicElement[] = [];
        if (text.length) {
            // Split up the paragraphs
            for (const paragraph of text.split(/\n\s*\n/g)) {
                if (result.length > 0) {
                    result.push(Markup.PARAGRAPH);
                }
                result.push(...Markup.createTextElements(paragraph, options));
            }
        }
        return result;
    }
    /**
     * Constructs an IMarkupWebLink element that represents a hyperlink an internet URL.
     */
    public static createWebLink(textElements: MarkupLinkTextElement[], targetUrl: string): IMarkupWebLink {
        if (!textElements.length) {
            throw new Error('Missing text for link');
        }
        if (!targetUrl || !targetUrl.trim()) {
            throw new Error('Missing link target');
        }

        return {
            kind: 'web-link',
            elements: textElements,
            targetUrl: targetUrl
        };
    }
    /**
     * Constructs an IMarkupApiLink element that represents a hyperlink to the specified
     * API object. The hyperlink is applied to an existing stream of markup elements
     */
    public static createApiLink(textElements: MarkupLinkTextElement[], target: IApiItemReference): IMarkupApiLink {
        if (!textElements.length) {
            throw new Error('Missing text for link');
        }

        if (!target.packageName || target.packageName.length < 1) {
            throw new Error('The IApiItemReference.packageName cannot be empty');
        }

        return {
            kind: 'api-link',
            elements: textElements,
            target: target
        };
    }

    /**
     * Constructs an IMarkupApiLink element that represents a hyperlink to the specified
     * API object. The hyperlink is applied to a plain text string.
     */
    public static createApiLinkFromText(text: string, target: IApiItemReference): IMarkupApiLink {
        return Markup.createApiLink(Markup.createTextElements(text), target);
    }

    /** Constructs an IMarkupParagraphAndElements element with the specified elements */
    public static createParagraphAndElements(elements: MarkupBasicElement[]): IMarkupParagraphAndElements {
        return {
            kind: 'paragraph&elements',
            elements: elements
        };
    }

    /** Constructs an IMarkupHtmlTag element representing an opening or closing HTML tag */
    public static createHtmlTag(token: string): IMarkupHtmlTag {
        if (token.length === 0) {
            throw new Error('The code parameter is missing');
        }
        return {
            kind: 'html-tag',
            token: token
        };
    }

    /** Constructs an IMarkupSection element with the specified elements */
    public static createSection(elements: MarkupBasicElement[]): IMarkupSection {
        return {
            kind: 'section',
            elements: elements
        };
    }

    /**
     * Constructs an IMarkupCodeBox element representing a program code text
     * with specified syntax highlighted
     */
    public static createCodeBox(code: string, highlighter: MarkupHighlighter): IMarkupCodeBox {
        if (!code.length) {
            throw new Error('The code parameter is empty');
        }
        return {
            kind: 'code-box',
            text: code,
            highlighter: highlighter
        };
    }

    /** Constructs an IMarkupListRow element that will display the specified plain text string */
    public static createListRow(
        cellValues: Array<Array<MarkupElement>> | undefined = undefined
    ): IMarkupListRow {
        const row: IMarkupListRow = {
            kind: 'list-row',
            cells: []
        };

        if (cellValues) {
            for (const cellValue of cellValues) {
                const cell: IMarkupListCell = {
                    kind: 'list-cell',
                    elements: cellValue
                };
                row.cells.push(cell);
            }
        }

        return row;
    }

    /**
     * Constructs an IMarkupList element containing the specified header cells, which each contain
     * a sequence of MarkupBasicElement content.
     */
    public static createList(): IMarkupList {
        return {
            kind: 'list',
            rows: []
        };
    }

    /**
     * Use this to clean up a MarkupElement sequence, assuming the sequence is now in
     * its final form.
     */
    public static normalize<T extends MarkupElement>(elements: T[]): void {
        let i: number = 0;

        while (i < elements.length) {
            const element: T = elements[i];
            const previousElement: T | undefined = i - 1 >= 0 ? elements[i - 1] : undefined;
            const nextElement: T | undefined = i + 1 < elements.length ? elements[i + 1] : undefined;

            const paragraphBefore: boolean = !!(previousElement && previousElement.kind === 'paragraph');
            const paragraphAfter: boolean = !!(nextElement && nextElement.kind === 'paragraph');

            if (element.kind === 'paragraph') {
                if (i === 0 || i === elements.length - 1 || paragraphBefore) {
                    // Delete this element. We do not update i because the "previous" item
                    // is unchanged on the next loop.
                    elements.splice(i, 1);
                    continue;
                }
            } else if (element.kind === 'text') {
                const textElement: IMarkupText = element as IMarkupText;
                if (paragraphBefore || i === 0) {
                    textElement.text = textElement.text.replace(/^\s+/, ''); // trim left
                }

                if (paragraphAfter || i === elements.length - 1) {
                    textElement.text = textElement.text.replace(/\s+$/, ''); // trim right
                }
            }

            ++i;
        }
    }

    /** This formats an IApiItemReference as its AEDoc notation. */
    public static formatApiItemReference(apiItemRefence: IApiItemReference): string {
        let result: string = apiItemRefence.exportName;
        if (apiItemRefence.packageName) {
            result = apiItemRefence.packageName + '#' + result;

            if (apiItemRefence.scopeName) {
                result = apiItemRefence.scopeName + '/' + result;
            }
        }
        if (apiItemRefence.memberName) {
            result += '.' + apiItemRefence.memberName;
        }
        return result;
    }

    /** Extracts plain text from the provided markup elements, discarding any formatting */
    public static extractTextContext(elements: MarkupElement[]): string {
        // Pass a buffer, since "+=" uses less memory than "+"
        const buffer: {text: string} = {text: ''};
        Markup._extractTextContent(elements, buffer);
        return buffer.text;
    }

    /** Constructs an IMarkupNoteBox element that will display the specified markup content */
    public static createNoteBox(textElements: MarkupBasicElement[]): IMarkupNoteBox {
        return {
            kind: 'note-box',
            elements: textElements
        };
    }

    /** Constructs an IMarkupNoteBox element that will display the specified plain text string */
    public static createNoteBoxFromText(text: string): IMarkupNoteBox {
        return Markup.createNoteBox(Markup.createTextElements(text));
    }

    private static _trimRawText(text: string): string {
        // Replace multiple whitespaces with a single space
        return text.replace(/\s+/g, ' ');
    }

    private static _extractTextContent(elements: MarkupElement[], buffer: {text: string}): void {
        for (const element of elements) {
            switch (element.kind) {
                case 'api-link':
                    buffer.text += Markup.extractTextContext(element.elements);
                    break;
                case 'break':
                    buffer.text += '\n';
                    break;
                case 'code-box':
                    break;
                case 'paragraph':
                    buffer.text += '\n\n';
                    break;
                case 'text':
                    buffer.text += element.text;
                    break;
                case 'web-link':
                    buffer.text += Markup.extractTextContext(element.elements);
                    break;
                default:
                    throw new Error('Unsupported element kind');
            }
        }
    }
}