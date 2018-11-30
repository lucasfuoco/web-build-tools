import { SourceFile } from 'typescript';
import {
    AstItem,
    AstItemKind,
    AstPackage,
    ExtractorContext
} from '../../../tutorial-extractor/src/index';
import { UTIL_GetExtractorContext } from '../utils/util_extractor_context';

describe('Class AstPackage', () => {
    let instance: AstPackage;
    beforeAll(() => {
        const extractorContext: ExtractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = extractorContext.program.getSourceFile(
            extractorContext.entryPointFile
        );
        instance = new AstPackage(extractorContext, rootFile!);
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is a instance of AstItem', () => {
        expect(instance instanceof AstItem).toBeTruthy();
    });

    it('has variable kind', () => {
        expect(instance.kind).toBeDefined();
    });

    it('variable kind is type object', () => {
        expect(typeof instance.kind).toBe('number');
    });

    it('variable kind is kind Package', () => {
        expect(instance.kind).toBe(AstItemKind.Package);
    });

    it('has variable name', () => {
        expect(instance.name).toBeDefined();
    });

    it('variable name is type string', () => {
        expect(typeof instance.name).toBe('string');
    });

    it('variable name returns the package name', () => {
        expect(instance.name).toBe('@ossiaco/tutorial-extractor-tests');
    });
});