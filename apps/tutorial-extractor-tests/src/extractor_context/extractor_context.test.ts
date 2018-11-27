import {
    Diagnostic,
    DiagnosticCategory
} from 'typescript';
import {
    AstModule,
    DocItemLoader,
    ExtractorContext
} from '../../../tutorial-extractor/src/index';
import { UTIL_GetExtractorContext } from '../index';

describe('Class ExtractorContext', () => {
    let instance: ExtractorContext;
    let m_packageName: void;
    beforeAll(() => {
        const diagnostic: Diagnostic = {
            category: DiagnosticCategory.Error,
            code: 1,
            file: undefined,
            start: undefined,
            length: undefined,
            messageText: 'This is a test error message.'
        };
        instance = UTIL_GetExtractorContext();
        m_packageName = instance.reportError('TypeScript: ' + diagnostic.messageText, diagnostic.file, diagnostic.start);
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of ExtractorContext', () => {
        expect(instance instanceof ExtractorContext).toBeTruthy();
    });

    it('has variable docItemLoader', () => {
        expect(instance.docItemLoader).toBeDefined();
    });

    it('variable docItemLoader is an instance of DocItemLoader', () => {
        expect(instance.docItemLoader instanceof DocItemLoader).toBeTruthy();
    });

    it('has variable package', () => {
        expect(instance.package).toBeDefined();
    });

    it('variable package is a instance of AstModule', () => {
        expect(instance.package instanceof AstModule).toBeTruthy();
    });

    it('has variable typeChecker', () => {
        expect(instance.typeChecker).toBeDefined();
    });

    it('variable typeChecker is type object', () => {
        expect(typeof instance.typeChecker).toBe('object');
    });

    it('has variable program', () => {
        expect(instance.program).toBeDefined();
    });

    it('variable program is type object', () => {
        expect(typeof instance.program).toBe('object');
    });

    it('has variable entryPointFile', () => {
        expect(instance.entryPointFile).toBeDefined();
    });

    it('variable entryPointFile is type string', () => {
        expect(typeof instance.entryPointFile).toBe('string');
    });

    it('has method packageFolder', () => {
        expect(instance.packageFolder).toBeDefined();
    });

    it('method packageFolder is type string', () => {
        expect(typeof instance.packageFolder).toBe('string');
    });

    it('method packageFolder returns root', () => {
        expect(instance.packageFolder).toBe(process.cwd());
    });

    it('has method packageName', () => {
        expect(instance.packageName).toBeDefined();
    });

    it('method packageName is type string', () => {
        expect(typeof instance.packageName).toBe('string');
    });

    it('method packageName returns the package name', () => {
        expect(instance.packageName).toBe('@ossiaco/tutorial-extractor-tests');
    });

    it('has method reportError', () => {
        expect(typeof m_packageName).toBe('undefined');
    });
});