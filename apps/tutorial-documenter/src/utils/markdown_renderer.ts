import {
    MarkupElement,
    IMarkupText
} from '@ossiaco/tutorial-extractor';
import {
    IMarkdownRendererOptions,
    IRenderContext,
    IMarkdownRenderApiLinkArgs
} from './markdown_renderer.types';
import {SimpleWriter} from './simple_writer';

// tslint:disable-next-line:export-name
export class MarkdownRenderer {
    public static renderElements(elements: MarkupElement[], options: IMarkdownRendererOptions): string {
        const writer: SimpleWriter = new SimpleWriter();
        const context: IRenderContext = {
            writer: writer,
            insideTable: false,
            options: options,
            depth: 0
        };

        MarkdownRenderer._writeElements(elements, context);

        if (context.depth !== 0) {
            throw new Error('Unbalanced depth'); // this would indicate a program bug
        }

        writer.ensureNewLine(); // finish the last line
        return writer.toString();
    }

    private static _writeElements(elements: MarkupElement[], context: IRenderContext): void {
        ++context.depth;
        const writer: SimpleWriter = context.writer;
        const mergedElements: MarkupElement[] = MarkdownRenderer._mergeTextElements(elements);

        for (const element of mergedElements) {
            switch (element.kind) {
                case 'text':
                    let normalizedContext: string = element.text;
                    if (context.insideTable) {
                        normalizedContext = normalizedContext.replace('\n', ' ');
                    }
                    const lines: string[] = normalizedContext.split('\n');
                    let firstLine: boolean = true;
                    for (const line of lines) {
                        if (firstLine) {
                            firstLine = false;
                        } else {
                            writer.writeLine();
                        }

                        // split out the [leading whitespace, context, trailing whitespace]
                        const parts: string[] = line.match(/^(\s*)(.*?)(\s*)$/) || [];
                        writer.write(parts[1]); // write leading whitespace

                        const middle: string = parts[2];

                        if (middle !== '') {
                            switch (writer.peekLastCharacter()) {
                                case '':
                                case '\n':
                                case ' ':
                                case '[':
                                case '>':
                                    break;
                                default:
                                    writer.write('<!-- -->');
                                    break;
                            }

                            if (element.bold) {
                                writer.write('**');
                            }
                            if (element.italics) {
                                writer.write('_');
                            }
                            writer.write(this._getEscapedText(middle));

                            if (element.italics) {
                                writer.write('_');
                            }
                            if (element.bold) {
                                writer.write('**');
                            }
                            writer.write(parts[3]);
                        }
                    }
                    break;
                case 'html-tag':
                    // write the HTML element verbatim into the output
                    writer.write(element.token);
                    break;
                case 'section':
                    writer.ensureSkippedLine();
                    writer.writeLine('<section>');
                    MarkdownRenderer._writeElements(element.elements, context);
                    writer.writeLine('</section>');
                    writer.writeLine();
                    break;
                case 'api-link':
                    if (!context.options.onRenderApiLink) {
                        throw new Error(
                            'IMarkupApiLink cannot be rendered because a renderApiLink handler was not provided'
                        );
                    }
                    const args: IMarkdownRenderApiLinkArgs = {
                        reference: element.target,
                        prefix: '',
                        suffix: ''
                    };

                    // NOTE: The onRenderApiLink() callback will assign values to the args.prefix
                    // and args.suffix properties, which are used below.  (It is modeled this way because
                    // MarkdownRenderer._writeElements() may need to emit different escaping e.g. depending
                    // on what characters were written by writer.write(args.prefix).)
                    context.options.onRenderApiLink(args);

                    if (args.prefix) {
                        writer.write(args.prefix);
                    }
                    MarkdownRenderer._writeElements(element.elements, context);
                    if (args.suffix) {
                        writer.write(args.suffix);
                    }
                    break;
                case 'web-link':
                    writer.write('[');
                    MarkdownRenderer._writeElements(element.elements, context);
                    writer.write(`](${element.targetUrl})`);
                    break;
                case 'paragraph':
                    if (element && element.text) {
                        writer.write('<div class="markdown level0 summary">');
                        writer.write('<p>' + element.text + '</p>');
                        writer.write('</div>');
                    }
                    if (context.insideTable) {
                        writer.write('<p/>');
                    } else {
                        writer.ensureNewLine();
                        writer.writeLine();
                    }
                    break;
                case 'paragraph&elements':
                    writer.write('<div class="markdown level0 summary">');
                    writer.write('<p id="document_description">');
                    MarkdownRenderer._writeElements(element.elements, context);
                    writer.write('</p>');
                    writer.write('</div>');
                    writer.writeLine();
                    break;
                case 'break':
                    writer.writeLine('<br/>');
                    break;
                case 'code-box':
                    writer.ensureNewLine();
                    writer.write('```');
                    switch (element.highlighter) {
                        case 'javascript':
                            writer.write('javascript');
                            break;
                        case 'plain':
                            break;
                        default:
                            throw new Error('Unimplemented highlighter');
                    }
                    writer.writeLine();
                    writer.write(element.text);
                    writer.writeLine();
                    writer.writeLine('```');
                    break;
                case 'note-box':
                    writer.ensureNewLine();
                    writer.write('> ');
                    MarkdownRenderer._writeElements(element.elements, context);
                    writer.ensureNewLine();
                    writer.writeLine();
                    break;
                case 'list':
                    for (const row of element.rows) {
                        row.cells.map((cell: MarkupElement) => {
                            if (cell.elements) {
                                MarkdownRenderer._writeElements(cell.elements, context);
                            }
                        });
                    }
                    break;
                case 'page':
                    if (context.depth !== 1 || elements.length !== 1) {
                        throw new Error('The page element must to be the top-level element of the document');
                    }

                    if (element.breadcrumb.length) {
                        // Write the breadcrumb before the title
                        MarkdownRenderer._writeElements(element.breadcrumb, context);
                        writer.ensureNewLine();
                        writer.writeLine();
                    }

                    if (element.title) {
                        writer.writeLine('<h1 id="document_name">');
                        writer.writeLine(this._getEscapedText(element.title));
                        writer.writeLine('</h1>');
                        writer.writeLine();
                    }

                    MarkdownRenderer._writeElements(element.elements, context);
                    writer.ensureNewLine();
                    break;
                default:
                    throw new Error('Unsupported element kind: ' + element.kind);
            }
        }
        --context.depth;
    }

    private static _getEscapedText(text: string): string {
        const textWithBackslashes: string = text
        .replace(/\\/g, '\\\\')  // first replace the escape character
        .replace(/[*#[\]_|`~]/g, (x) => '\\' + x) // then escape any special characters
        .replace(/---/g, '\\-\\-\\-') // hyphens only if it's 3 or more
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
        return textWithBackslashes;
    }

    /** Merges any IMarkupText elements with compatible styles; this simplifies the emitted Markdown */
    private static _mergeTextElements(elements: MarkupElement[]): MarkupElement[] {
        const mergedElements: MarkupElement[] = [];
        let previousElement: MarkupElement | undefined;

        for (const element of elements) {
            if (previousElement) {
                if (element.kind === 'text' && previousElement.kind === 'text') {
                    if (element.bold === previousElement.bold && element.italics === previousElement.italics) {
                        mergedElements.pop();
                        const combinedElement: IMarkupText = { // push a combined element
                            kind: 'text',
                            text: previousElement.text + element.text,
                            bold: previousElement.bold,
                            italics: previousElement.italics
                        };

                        mergedElements.push(combinedElement);
                        previousElement = combinedElement;
                        continue;
                    }
                }
            }

            mergedElements.push(element);
            previousElement = element;
        }

        return mergedElements;
    }
}