import {ApiFileGenerator} from '../../../tutorial-extractor/src/index';

describe('Class ApiFileGenerator', () => {
    let instance: ApiFileGenerator;
    let writeApiFile: void;
    let generateApiFileContent: string;
    beforeAll(() => {
        instance = new ApiFileGenerator();
        writeApiFile = instance.writeApiFile('report.txt');
        generateApiFileContent = instance.generateApiFileContent();
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of ApiFileGenerator', () => {
        expect(instance instanceof ApiFileGenerator).toBeTruthy();
    });

    it('has method writeApiFile', () => {
        expect(writeApiFile).toBeUndefined();
    });

    it('has method generateApiFileContent', () => {
        expect(generateApiFileContent).toBeDefined();
    });

    it('method generateApiFileContent is type string', () => {
        expect(typeof generateApiFileContent).toBe('string');
    });

    it('method generateApiFileContent returns empty string by default', () => {
        expect(generateApiFileContent).toBe('');
    });
});