/**
 * @public
 * @tutorial
 * @tutorialname Nothing
 */

import { SourceFile, Symbol } from 'typescript';
import {
    ExtractorContext,
    IAstItemOptions,
    UtilTypescriptHelpers
} from '@ossiaco/tutorial-extractor';

/** Get the abstract syntax tree item options. */
// tslint:disable-next-line:export-name
export function UTIL_GetAstItemOptions (context: ExtractorContext, rootFile: SourceFile): IAstItemOptions {
    const rootFileSymbol: Symbol | undefined = UtilTypescriptHelpers.getSymbolForDeclaration(rootFile);

    if (!rootFileSymbol || !rootFileSymbol.declarations) {
        throw new Error('Unable to find root declaration for this package');
    }

    return {
        context,
        declaration: rootFileSymbol.declarations[0],
        declarationSymbol: rootFileSymbol
    };
}