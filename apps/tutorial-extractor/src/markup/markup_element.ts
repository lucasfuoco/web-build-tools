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
    elements?: MarkupLinkTextElement[];
}

/** Represents an HTML tag such as `<td>` or `</td> or `<img src="example/gif" />` */
export interface IMarkupHtmlTag {
    /** The kind of markup element */
    kind: 'html-tag';
    /** A string containing the HTML tag */
    token: string;
    elements?: MarkupLinkTextElement[];
}
// ---------------------------------------------------------------------------------------------------------------
// Represents markup that can be used as the link text for a hyperlink
// ---------------------------------------------------------------------------------------------------------------
export type MarkupLinkTextElement = IMarkupText | IMarkupHtmlTag;

/** A hyperlink to an API item */
export interface IMarkupApiLink {
    /** The kind of markup element */
    kind: 'api-link';
    /** The link text */
    elements: MarkupElement[];
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
    text?: string;
    elements?: MarkupBasicElement[];
}

/** A line break, similar to the "<br>" tag in HTML */
export interface IMarkupLineBreak {
    /** This kind of markup element */
    kind: 'break';
    elements?: MarkupBasicElement[];
}

/** A paragraph with elements */
export interface IMarkupParagraphAndElements {
    /** kind of the markup element */
    kind: 'paragraph&elements';
    elements: MarkupBasicElement[];
}

export interface IMarkupSection {
    /** The kind of markup element */
    kind: 'section';
    elements: MarkupBasicElement[];
}

// ---------------------------------------------------------------------------------------------------------------
// Represents basic text consisting of paragraphs and links (without structures such as headers or tables)
// ---------------------------------------------------------------------------------------------------------------
export type MarkupBasicElement = MarkupLinkTextElement | IMarkupApiLink | IMarkupWebLink | IMarkupParagraph
    | IMarkupLineBreak | IMarkupParagraphAndElements | IMarkupSection;

/** A box containing source code with syntax highlighting */
export interface IMarkupCodeBox {
    /** The kind of markup element */
    kind: 'code-box';
    text: string;
    highlighter: MarkupHighlighter;
    elements?: MarkupStructuredElement[];
}

/** The call-out box containing an informational note */
export interface IMarkupNoteBox {
    /** The kind of markup element */
    kind: 'note-box';
    elements: MarkupBasicElement[];
}

/** A list, with optional header row */
export interface IMarkupList {
    kind: 'list';
    rows: IMarkupListRow[];
    elements?: MarkupStructuredElement[];
}

// ---------------------------------------------------------------------------------------------------------------
// Represents structured text that contains headings, tables, and boxes. These are the top-level
// elements of a IMarkupPage
// ---------------------------------------------------------------------------------------------------------------
export type MarkupStructuredElement = MarkupBasicElement | IMarkupCodeBox | IMarkupNoteBox | IMarkupList;

// ---------------------------------------------------------------------------------------------------------------
// The super set of all markup interfaces, used e.g for functions that recursively traverse the tree
// ---------------------------------------------------------------------------------------------------------------

/** Represents the whole page */
export interface IMarkupPage {
    /** The kind of markup element */
    kind: 'page';
    breadcrumb: MarkupBasicElement[];
    title: string;
    elements: MarkupStructuredElement[];
}

/** A cell inside an IMarkupListRow element. */
export interface IMarkupListCell {
    /** The kind of markup element */
    kind: 'list-cell';
    /** The text content for the list cell */
    elements: MarkupElement[];
}

/** A row inside an IMarkupList element. */
export interface IMarkupListRow {
    /** The kind of markup element */
    kind: 'list-row';
    cells: IMarkupListCell[];
    elements: MarkupElement[];
    category: MarkupElement[];
}

export type MarkupElement = MarkupStructuredElement | IMarkupPage | IMarkupListCell | IMarkupListRow;