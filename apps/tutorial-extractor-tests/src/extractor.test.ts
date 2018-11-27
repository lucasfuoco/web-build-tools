import { Extractor } from '../../tutorial-extractor/src/index';

describe('Class Extractor', () => {
    let instance: Extractor;
    beforeAll(() => {
        instance = new Extractor({
            compiler: {
                rootFolder: process.cwd()
            },
            project: {
                entryPoint: 'src/index.ts'
            },
            apiJsonFile: {
                enabled: true,
                outputFolder: 'temp'
            }
        });
    });
    it('is defined', () => {
        expect(instance).toBeDefined();
    });
});
