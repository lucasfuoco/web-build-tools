import {
    CommentRange,
    Declaration,
    Node,
    Symbol,
    SymbolFlags,
    Type,
    TypeChecker
} from 'typescript';
import * as ts from 'typescript';
import {
    UtilPrettyPrinter
} from './util_pretty_printer';

export class UtilTypescriptHelpers {
    /**
     * Splits on CRLF and other newline sequences
     */
    private static _newLineRegEx: RegExp = /\r\n|\n\r|\r|\n/g;
    /** Start sequence is '/**'. */
    private static _jsdocStartRegEx: RegExp = /^\s*\/\*\*+\s*/;
    /** End sequence is '*\/'. */
    private static _jsdocEndRegEx: RegExp = /\s*\*+\/\s*$/;
    /** Intermediate lines of JSDoc comment character. */
    private static _jsdocIntermediateRegEx: RegExp = /^\s*\*\s?/;
    /** Trailing white space */
    private static _jsdocTrimRightRegEx: RegExp = /\s*$/;
    /**
     * Returns the Symbol for the provided Declaration.
     */
    static tryGetSymbolForDeclaration (declaration: Declaration): Symbol | undefined {
        if (!declaration) {
            return undefined;
        }
        return (declaration as Declaration & Type).symbol as Symbol;
    }
    /**
     * Same semantics as tryGetSymbolForDeclaration, but throws an exeption if the symbol
     * cannot be found.
     */
    static getSymbolForDeclaration (declaration: Declaration): Symbol | undefined {
        const symbol: Symbol | undefined = UtilTypescriptHelpers.tryGetSymbolForDeclaration(declaration);
        if (!symbol) {
            UtilPrettyPrinter.throwUnexpectedSyntaxError(
                declaration,
                'Unable to determine the semantic information for this declaration'
            );
        }
        return symbol;
    }
    /**
     * Find the original place where an item was defined.
     * For example, suppose a class is exported from the package's index.ts.
     */
    static followAliases (symbol: Symbol, typeChecker: TypeChecker): Symbol {
        let current: Symbol = symbol;
        while (true) {
            if (!(current.flags & SymbolFlags.Alias)) {
                break;
            }
            const currentAlias: Symbol = typeChecker.getAliasedSymbol(current);
            if (!currentAlias || currentAlias === current) {
                break;
            }
            current = currentAlias;
        }

        return current;
    }
    /**
     * Retrieves the comment ranges associated with the specified node.
     */
    static getJSDocCommentRanges (_node: Node, _text: string): CommentRange[] | undefined {
        // Compiler internal:
        // https://github.com/Microsoft/TypeScript/blob/v2.4.2/src/compiler/utilities.ts#L616
        return (ts as any).getJSDocCommentRanges.apply(this, arguments);
    }
    /**
     * Similar to calling string.split() with RegExp, except that the delimiters
     * are included in the result
     */
    static splitStringWithRegEx(text: string, regExp: RegExp): string[] {
        if (!regExp.global) {
            throw new Error('RegExp must have the /g flag');
        }
        if (text === undefined) {
            return [];
        }

        const result: string[] = [];
        let index = 0;
        let match: RegExpExecArray | null;

        do {
            match = regExp.exec(text);
            if (match) {
                if (match.index > index) {
                    result.push(text.substring(index, match.index));
                }
                const matchText: string = match[0];
                if (!matchText) {
                    // It might be interesting to support matching e.g '\b', but regExp.exec()
                    // doesn't seem to iterate properly in this situation.
                    throw new Error('The regular expression must match a nonzero number of characters');
                }
                result.push(matchText);
                index = regExp.lastIndex;
            }
        } while (match && regExp.global);

        if (index < text.length) {
            result.push(text.substr(index));
        }
        return result;
    }
    /**
     * Extracts the body of a tutorial file and returns it
     */
    static extractJSDocContent (text: string, errorLogger: (message: string) => void): string {
        // Remove any leading/trailing whitespace around the comment characters, then split on newlines
        const lines: string[] = text.trim().split(UtilTypescriptHelpers._newLineRegEx);
        if ((lines.length === 0) || !(UtilTypescriptHelpers._jsdocStartRegEx.test(text))) {
            return '';
        }

        let matched: boolean;

        // Remove "/**" from all lines
        matched = false;
        for (let i = 0; i < lines.length; i++) {
            lines[i] = lines[i].replace(UtilTypescriptHelpers._jsdocStartRegEx, () => {
                matched = true;
                return '';
            });
        }

        if (!matched) {
            errorLogger('The comment does not begin with a \"/**\" delimiter');
            return '';
        }

        // Remove "*/" from all lines
        matched = false;
        for (let i = 0; i < lines.length; i++) {
            lines[i] = lines[i].replace(UtilTypescriptHelpers._jsdocEndRegEx, () => {
                matched = true;
                return '';
            });
        }

        if (!matched) {
            errorLogger('The comment does not end with a \"*/\" delimiter.');
            return '';
        }

        // Remove a leading "*" from all lines except the first one
        for (let i = 1; i < lines.length; ++i) {
            lines[i] = lines[i].replace(UtilTypescriptHelpers._jsdocIntermediateRegEx, '');
        }

        // Remove trailing spaces from all lines
        for (let i = 0; i < lines.length; ++i) {
            lines[i] = lines[i].replace(UtilTypescriptHelpers._jsdocTrimRightRegEx, '');
        }

        // If the lines are blank, then remove them
        for (let i = 0; i < lines.length; i++) {
            if (lines[i] === '') {
                lines.splice(i, 1);
            }
        }

        return lines.join('\n');
    }
}