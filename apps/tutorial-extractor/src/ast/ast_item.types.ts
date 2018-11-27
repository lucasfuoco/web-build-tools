import {
    Declaration,
    Symbol,
    TextRange
} from 'typescript';
import { ExtractorContext } from '../index';

export enum AstItemKind {
    /** The default value which is no kind. */
    Default,
    /** A Typescript package. */
    Package,
    /** A Typescript tutorial. */
    Tutorial,
    /** A Typescript tutorial step */
    Step
}

/**
 * The state of completing the AstItem's doc comment references inside a recursive call to AstItem.resolveReferences()
 */
export enum InitializationState {
    /** The references of this AstItem have not begun to be completed. */
    Incomplete,
    /**
     * The references of this AstItem are in the process of being completed.
     * If we encounter this state again during completing, a circular dependency
     * has occurred.
     */
    Completing,
    /**
     * The references of this AstItem have all been completed and the documentation can
     * now safely be created.
     */
    Completed
}

/** The abstract syntax tree item options for the AstItem contructor. */
export interface IAstItemOptions {
    /** The associated ExtractorContext object for this AstItem */
    context: ExtractorContext;
    /** The declaration node for the main syntax item that this AstItem is associated with. */
    declaration: Declaration;
    /** The semantic information for the declaration. */
    declarationSymbol: Symbol;
    /** The JSDoc-style comment range. */
    aedocCommentRange?:  TextRange;
    /** The symbol used to export this AstItem from the AstPackage */
    exportSymbol?: Symbol;
    /** The source file in text. */
    sourceFileText?: string;
}