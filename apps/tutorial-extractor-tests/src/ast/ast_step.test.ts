import {SourceFile} from 'typescript';
import {UTIL_GetAstItemOptions} from '../utils/util_ast_item_options';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';
import {
    ExtractorContext,
    AstStep,
    AstItem,
    IAstItemOptions
} from '@ossiaco/tutorial-extractor';

describe('Class AstStep', () => {
    let instance: AstStep;
    beforeAll(() => {
        const extractorContext: ExtractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = extractorContext.program.getSourceFile(
            extractorContext.entryPointFile
        );
        const options: IAstItemOptions = UTIL_GetAstItemOptions(extractorContext, rootFile!);
        instance = new AstStep(options);
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of AstItem', () => {
        expect(instance instanceof AstItem).toBeTruthy();
    });
});