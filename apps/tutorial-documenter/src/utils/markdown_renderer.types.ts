import { IApiItemReference } from '@ossiaco/tutorial-extractor';
import {SimpleWriter} from './simple_writer';

export interface IRenderContext {
    writer: SimpleWriter;
    insideTable: boolean;
    options: IMarkdownRendererOptions;
    depth: number;
}

export interface IMarkdownRenderApiLinkArgs {
    /** The IApiItemReference being rendered. */
    readonly reference: IApiItemReference;
    /**
     * The callback can assign text here that will be inserted before the link text.
     * Example: "["
     */
    prefix: string;
    /**
     * The callback can assign text here that will be inserted after the link text.
     * Example: "](./TargetPage.md)"
     */
    suffix: string;
}

export interface IMarkdownRendererOptions {
    /**
     * This callback receives an IMapupApiLink, and returns the rendered markdown context.
     * If the callback is not provided, an error occurs if an IMarkupApiLink is encountered.
     */
    onRenderApiLink?: (args: IMarkdownRenderApiLinkArgs) => void;
}