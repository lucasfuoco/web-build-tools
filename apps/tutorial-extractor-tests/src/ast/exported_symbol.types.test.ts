import {
    SourceFile,
    Symbol,
    TypeChecker
} from 'typescript';
import {
    IAstItemOptions,
    IExportedSymbol,
    ExtractorContext,
    UtilTypescriptHelpers
} from '@ossiaco/tutorial-extractor';
import { UTIL_GetAstItemOptions } from '../utils/util_ast_item_options';
import { UTIL_GetExtractorContext } from '../utils/util_extractor_context';

describe('Interface IExportedSymbol', () => {
    let exportedSymbol: IExportedSymbol;
    beforeAll(() => {
        const context: ExtractorContext = UTIL_GetExtractorContext();
        const typeChecker: TypeChecker = context.typeChecker;
        const rootFile: SourceFile | undefined = context.program.getSourceFile(context.entryPointFile);
        const options: IAstItemOptions = UTIL_GetAstItemOptions(context, rootFile!);
        const exportSymbol: Symbol = typeChecker.getExportsOfModule(options.declarationSymbol)[0];
        const followedSymbol: Symbol = UtilTypescriptHelpers.followAliases(exportSymbol, typeChecker);
        exportedSymbol = {
            exportedName: '',
            followedSymbol: followedSymbol
        };
    });

    it('is defined', () => {
        expect(exportedSymbol).toBeDefined();
    });

    it('contains the right keys', () => {
        expect(Object.keys(exportedSymbol)).toEqual([
            'exportedName',
            'followedSymbol'
        ]);
    });

    it('key exportedName is type string', () => {
        expect(typeof exportedSymbol.exportedName).toBe('string');
    });

    it('key followedSymbol is type object', () => {
        expect(typeof exportedSymbol.followedSymbol).toBe('object');
    });
});