import {
    AstTutorial,
    ExtractorContext,
    AstItem,
    AstItemKind,
    IAstItemOptions
} from '@ossiaco/tutorial-extractor';
import { SourceFile } from 'typescript';
import {
    UTIL_GetAstItemOptions,
    UTIL_GetExtractorContext
} from '../index';

describe('Class AstTutorial', () => {
    let instance: AstTutorial;
    beforeAll(() => {
        const extractorContext: ExtractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = extractorContext.program.getSourceFile(
            extractorContext.entryPointFile
        );
        const options: IAstItemOptions = UTIL_GetAstItemOptions(extractorContext, rootFile!);
        instance = new AstTutorial({...options, ...{steps: []}});
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of AstItem', () => {
        expect(instance instanceof AstItem).toBeTruthy();
    });

    it('variable kind is equal to tutorial', () => {
        expect(instance.kind).toEqual(AstItemKind.Tutorial);
    });
});