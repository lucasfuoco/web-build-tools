import {
    SourceFile
} from 'typescript';
import {
    AstItemKind,
    ExtractorContext,
    InitializationState,
    IAstItemOptions
} from '@ossiaco/tutorial-extractor';
import {
    UTIL_GetAstItemOptions,
    UTIL_GetExtractorContext
} from '../index';

describe('Enum AstItemKind', () => {

    it('is defined', () => {
        expect(AstItemKind).toBeDefined();
    });

    it('has the right values', () => {
        expect(AstItemKind).toEqual({
            '0': 'Default',
            '1': 'Package',
            '2': 'Tutorial',
            '3': 'Step',
            'Default': 0,
            'Package': 1,
            'Tutorial': 2,
            'Step': 3
        });
    });

    it('has enum value Default', () => {
        expect(AstItemKind.Default).toBeDefined();
    });

    it('has enum value Package', () => {
        expect(AstItemKind.Package).toBeDefined();
    });

    it('has enum value Tutorial', () => {
        expect(AstItemKind.Tutorial).toBeDefined();
    });

    it('has enum value Step', () => {
        expect(AstItemKind.Step).toBeDefined();
    });
});

describe('Enum InitializationState', () => {
    it('is defined', () => {
        expect(InitializationState).toBeDefined();
    });

    it('contains the right values', () => {
        expect(InitializationState).toEqual({
            0: 'Incomplete',
            1: 'Completing',
            2: 'Completed',
            'Completed': 2,
            'Completing': 1,
            'Incomplete': 0
        });
    });

    it('contains value Incomplete', () => {
        expect(InitializationState.Incomplete).toBeDefined();
    });

    it('contains value Completing', () => {
        expect(InitializationState.Completing);
    });

    it('contains value Completed', () => {
        expect(InitializationState.Completed);
    });
});

describe('Interface IAstItemOptions', () => {
    let astItemOptions: IAstItemOptions;
    beforeAll(() => {
        const extractorContext: ExtractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = extractorContext.program.getSourceFile(
            extractorContext.entryPointFile
        );
        astItemOptions = UTIL_GetAstItemOptions(extractorContext, rootFile!);
    });

    it('is defined', () => {
        expect(astItemOptions).toBeDefined();
    });

    it('is type object', () => {
        expect(typeof astItemOptions).toBe('object');
    });

    it('contains the right keys', () => {
        expect(Object.keys(astItemOptions)).toEqual([
            'context',
            'declaration',
            'declarationSymbol'
        ]);
    });

    it('key context is a instance of ExtractorContext', () => {
        expect(astItemOptions.context instanceof ExtractorContext).toBeTruthy();
    });

    it('key declaration is type object', () => {
        expect(typeof astItemOptions.declaration).toBe('object');
    });

    it('key declarationSymbol is type object', () => {
        expect(typeof astItemOptions.declarationSymbol).toBe('object');
    });
});