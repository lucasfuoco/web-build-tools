/** Options for Markup.createTextElements */
export interface IMarkupCreateTextOptions {
    /** Whether the text should be boldfaced */
    bold?: boolean;
    /** Whether the text should be italicized. */
    italics?: boolean;
}

/**
 * Indicates the text should be colorized according to the specified language syntax.
 * If "plain" is specified, then no highlighted should be performed
 */
export type MarkupHighlighter = 'javascript' | 'plain';