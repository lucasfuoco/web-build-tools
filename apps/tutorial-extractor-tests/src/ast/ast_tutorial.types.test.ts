import {SourceFile} from 'typescript';
import {
    IAstTutorialOptions,
    ExtractorContext
} from '@ossiaco/tutorial-extractor';
import {UTIL_GetAstItemOptions} from '../utils/util_ast_item_options';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';

describe('Interface IAstTutorialOptions', () => {
    let astTutorialOptions: IAstTutorialOptions;
    beforeAll(() => {
        const context: ExtractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = context.program.getSourceFile(context.entryPointFile);
        astTutorialOptions = {
            ...UTIL_GetAstItemOptions(context, rootFile!),
            steps: []
        };
    });

    it('is defined', () => {
        expect(astTutorialOptions).toBeDefined();
    });

    it('contains the right keys', () => {
        expect(Object.keys(astTutorialOptions)).toEqual([
            'context',
            'declaration',
            'declarationSymbol',
            'steps'
        ]);
    });

    it('key steps is type object', () => {
        expect(typeof astTutorialOptions.steps).toBe('object');
    });
});