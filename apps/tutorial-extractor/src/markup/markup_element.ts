import {IApiItemReference} from '../api/api_item';
import { MarkupHighlighter } from './markup.types';

/** A block of plain text, possibly with simple formatting such as bold or italics. */
export interface IMarkupText {
    /** The kind of markup element */
    kind: 'text';
    /** The plain content to display. */
    text: string;
    /** Whether the text should be formatted using boldface */
    bold?: boolean;
    /** Whether the text should be formatted using italics */
    italics?: boolean;
}
// ---------------------------------------------------------------------------------------------------------------
// Represents markup that can be used as the link text for a hyperlink
// ---------------------------------------------------------------------------------------------------------------
export type MarkupLinkTextElement = IMarkupText;

/** A hyperlink to an API item */
export interface IMarkupApiLink {
    /** The kind of markup element */
    kind: 'api-link';
    /** The link text */
    elements: MarkupLinkTextElement[];
    /** The API item that will serve as the hyperlink target */
    target: IApiItemReference;
}

/** A hyperlink to an internet URL */
export interface IMarkupWebLink {
    /** The kind of markup element */
    kind: 'web-link';
    /** The link text */
    elements: MarkupLinkTextElement[];
    /** The internet URL that will serve as the hyperlink target */
    targetUrl: string;
}

/** A paragraph separator, sililar to the "<p>" tag in HTML */
export interface IMarkupParagraph {
    /** Kind of markup element */
    kind: 'paragraph';
}

/** A line break, similar to the "<br>" tag in HTML */
export interface IMarkupLineBreak {
    /** This kind of markup element */
    kind: 'break';
}

// ---------------------------------------------------------------------------------------------------------------
// Represents basic text consisting of paragraphs and links (without structures such as headers or tables)
// ---------------------------------------------------------------------------------------------------------------
export type MarkupBasicElement = MarkupLinkTextElement | IMarkupApiLink | IMarkupWebLink | IMarkupParagraph
    | IMarkupLineBreak;

/** A box containing source code with syntax highlighting */
export interface IMarkupCodeBox {
    /** The kind of markup element */
    kind: 'code-box';
    text: string;
    highlighter: MarkupHighlighter;
}

// ---------------------------------------------------------------------------------------------------------------
// Represents structured text that contains headings, tables, and boxes. These are the top-level
// elements of a IMarkupPage
// ---------------------------------------------------------------------------------------------------------------
export type MarkupStructuredElement = MarkupBasicElement | IMarkupCodeBox;

// ---------------------------------------------------------------------------------------------------------------
// The super set of all markup interfaces, used e.g for functions that recursively traverse the tree
// ---------------------------------------------------------------------------------------------------------------
export type MarkupElement = MarkupStructuredElement;