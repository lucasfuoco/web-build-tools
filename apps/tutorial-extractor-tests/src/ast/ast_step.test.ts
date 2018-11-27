import {SourceFile} from 'typescript';
import {AstItem} from '../../../tutorial-extractor/src/ast/ast_item';
import {IAstItemOptions} from '../../../tutorial-extractor/src/ast/ast_item.types';
import {AstStep} from '../../../tutorial-extractor/src/ast/ast_step';
import {UTIL_GetAstItemOptions} from '../utils/util_ast_item_options';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';

describe('Class AstStep', () => {
    let instance: AstStep;
    beforeAll(() => {
        const extractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = extractorContext.program.getSourceFile(extractorContext.entryPointFile);
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