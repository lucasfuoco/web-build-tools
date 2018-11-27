import { SourceFile } from 'typescript';
import {
    AstItem,
    AstModule
} from '../../../tutorial-extractor/src/index';
import { UTIL_GetAstItemOptions } from '../utils/util_ast_item_options';
import { UTIL_GetExtractorContext } from '../utils/util_extractor_context';

describe('Class AstModule', () => {
    let instance: AstModule;
    beforeAll(() => {
        const extractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = extractorContext.program.getSourceFile(extractorContext.entryPointFile);
        instance = new AstModule(UTIL_GetAstItemOptions(extractorContext, rootFile!));
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of AstItem', () => {
        expect(instance instanceof AstItem).toBeTruthy();
    });
});