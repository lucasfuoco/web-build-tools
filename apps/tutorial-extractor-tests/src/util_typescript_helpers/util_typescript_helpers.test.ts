import { Program, SourceFile, Symbol } from 'typescript';
import { UtilTypescriptHelpers } from '@ossiaco/tutorial-extractor';
import { UTIL_GetExtractorContext } from '../index';

describe('Class UtilTypescriptHelpers', () => {
    let rootFile: SourceFile | undefined;
    let tryGetSymbolForDeclaration: Symbol | undefined;
    let getSymbolForDeclaration: Symbol | undefined;
    let rootFileFail: SourceFile | undefined;
    let extractJSDocContent: string;
    beforeAll(() => {
        const program: Program = UTIL_GetExtractorContext().program;
        const entryPointFile: string = UTIL_GetExtractorContext().entryPointFile;
        const jsDocContent: string = `/**
            * @public
            * @tutorial
            * @tutorialname Load Context
            * Load the runtime context.
            * @note blah blah blah
        */`;
        rootFileFail = program.getSourceFile('./test-fail.d.ts');
        rootFile = program.getSourceFile(entryPointFile);

        tryGetSymbolForDeclaration = UtilTypescriptHelpers.tryGetSymbolForDeclaration(rootFile!);
        getSymbolForDeclaration = UtilTypescriptHelpers.getSymbolForDeclaration(rootFile!);
        extractJSDocContent = UtilTypescriptHelpers.extractJSDocContent(
            jsDocContent,
            (message: string) => {
                throw new Error(message);
            }
        );
    });

    it('is defined', () => {
        expect(UtilTypescriptHelpers).toBeDefined();
    });

    it('has method tryGetSymbolForDeclaration', () => {
        expect(tryGetSymbolForDeclaration).toBeDefined();
    });

    it('method tryGetSymbolForDeclaration is type object', () => {
        expect(typeof tryGetSymbolForDeclaration).toBe('object');
    });

    it('method tryGetSymbolForDeclaration returns a instance of Symbol', () => {
        // tslint:disable-next-line:no-any
        expect(tryGetSymbolForDeclaration).toStrictEqual((rootFile as any).symbol);
    });

    it('has method getSymbolForDeclaration', () => {
        expect(getSymbolForDeclaration).toBeDefined();
    });

    it('method getSymbolForDeclaration is type object', () => {
        expect(typeof getSymbolForDeclaration).toBe('object');
    });

    it('method getSymbolForDeclaration returns a instance of Symbol', () => {
        // tslint:disable-next-line:no-any
        expect(getSymbolForDeclaration).toStrictEqual((rootFile as any).symbol);
    });

    it('method getSymbolForDeclaration throws error if the declaration provided is undefined', () => {
        expect(() => {
            UtilTypescriptHelpers.getSymbolForDeclaration(rootFileFail!);
        }).toThrowError('[undefined]: Unable to determine the semantic information for this declaration');
    });

    it('has method extractJSDocContent', () => {
        expect(extractJSDocContent).toBeDefined();
    });

    it('method extractJSDocContent is type string', () => {
        expect(typeof extractJSDocContent).toBe('string');
    });

    it('method extractJSDocContent returns the right string format', () => {
        expect(extractJSDocContent).toEqual(`@public\n@tutorial\n@tutorialname ` +
        `Load Context\nLoad the runtime context.\n@note blah blah blah`);
    });
});