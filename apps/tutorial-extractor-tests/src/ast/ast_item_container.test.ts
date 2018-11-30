import { SourceFile } from 'typescript';
import {
    AstItemContainer,
    ExtractorContext,
    IAstItemOptions
} from '../../../tutorial-extractor/src/index';
import { UTIL_GetAstItemOptions } from '../utils/util_ast_item_options';
import { UTIL_GetExtractorContext } from '../utils/util_extractor_context';

class AstModule extends AstItemContainer {
    constructor (options: IAstItemOptions) {
        super(options);
    }
}

describe('Class AstModule', () => {
    let instance: AstModule;
    beforeAll(() => {
        const context: ExtractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = context.program.getSourceFile(context.entryPointFile);
        const options: IAstItemOptions = UTIL_GetAstItemOptions(context, rootFile!);
        instance = new AstModule(options);
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is a instance of AstItemContainer', () => {
        expect(instance instanceof AstItemContainer).toBeTruthy();
    });
});