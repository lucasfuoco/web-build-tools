
import { SourceFile } from 'typescript';
import {ApiDocumentation} from '../../../tutorial-extractor/src/aedoc/api_documentation';
import {
    AstItem,
    AstItemKind,
    IAstItemOptions
} from '../../../tutorial-extractor/src/ast/index';
import {
    UTIL_GetAstItemOptions,
    UTIL_GetExtractorContext
} from '../index';

class AstStepDescription extends AstItem {
    constructor (options: IAstItemOptions) {
        super(options);
    }
}

describe('Abstract class AstItem', () => {
    let instance: AstStepDescription;
    let hasAnyIncompleteTags: boolean;
    beforeAll(() => {
        const extractorContext = UTIL_GetExtractorContext();
        const rootFile: SourceFile | undefined = extractorContext.program.getSourceFile(extractorContext.entryPointFile);
        const astItemOptions: IAstItemOptions = UTIL_GetAstItemOptions(extractorContext, rootFile!);
        instance = new AstStepDescription(astItemOptions);
        hasAnyIncompleteTags = instance.hasAnyIncompleteTags();
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

    it('variable kind is type number', () => {
        expect(typeof instance.kind).toBe('number');
    });

    it('variable kind is kind Default', () => {
        expect(instance.kind).toBe(AstItemKind.Default);
    });

    it('has variable name', () => {
        expect(instance.name).toBeDefined();
    });

    it('variable name is type string', () => {
        expect(typeof instance.name).toBe('string');
    });

    it('has variable innerItems', () => {
        expect(instance.innerItems).toBeDefined();
    });

    it('variable innerItems is type object', () => {
        expect(typeof instance.innerItems).toBe('object');
    });

    it('variable innerItems returns an empty array by default', () => {
        expect(instance.innerItems).toEqual([]);
    });

    it('has variable hasIncompleteTags', () => {
        expect(instance.hasIncompleteTags).toBeDefined();
    });

    it('variable hasIncompleteTags is type boolean', () => {
        expect(typeof instance.hasIncompleteTags).toBe('boolean');
    });

    it('variable hasIncompleteTags returns false by default', () => {
        expect(instance.hasIncompleteTags).toEqual(false);
    });

    it('has variable warnings', () => {
        expect(instance.warnings).toBeDefined();
    });

    it('variable warnings is type object', () => {
        expect(typeof instance.warnings).toBe('object');
    });

    it('variable warnings returns an empty array by default', () => {
        expect(instance.warnings).toEqual([]);
    });

    it('has variable documentation', () => {
        expect(instance.documentation).toBeDefined();
    });

    it('variable documentation is an instance of ApiDocumentation', () => {
        expect(instance.documentation instanceof ApiDocumentation).toBeTruthy();
    });

    it('has method hasAnyIncompleteTags', () => {
        expect(hasAnyIncompleteTags).toBeDefined();
    });

    it('method hasAnyIncompleteTags is type boolean', () => {
        expect(typeof hasAnyIncompleteTags).toBe('boolean');
    });

    it('method hasAnyIncompleteTags returns false by default', () => {
        expect(hasAnyIncompleteTags).toEqual(false);
    });
});