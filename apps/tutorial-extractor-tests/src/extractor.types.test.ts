import {
    createProgram,
    parseJsonConfigFileContent,
    sys,
    ParsedCommandLine
} from 'typescript';
import {
    IExtractorApiJsonConfig,
    IExtractorConfig,
    IExtractorProjectConfig,
    IExtractorTsConfig,
    IProgram,
    ITsConfig
} from '../../tutorial-extractor/src/index';

describe('Interface IExtractorConfig', () => {
    let extractorConfig: IExtractorConfig;
    beforeAll(() => {
        extractorConfig = {
            compiler: {
                rootFolder: process.cwd()
            },
            project: {
                entryPoint: 'lib/tutorial-extractor-tests/src/index.d.ts'
            },
            apiJsonFile: {
                enabled: true,
                outputFolder: 'temp'
            }
        };
    });
    it('is defined', () => {
        expect(extractorConfig).toBeDefined();
    });
    it('contains the right keys', () => {
        expect(Object.keys(extractorConfig)).toEqual([
            'compiler',
            'project',
            'apiJsonFile'
        ]);
    });
    it('key compiler is type object', () => {
        expect(typeof extractorConfig.compiler).toBe('object');
    });
    it('key project is type object', () => {
        expect(typeof extractorConfig.project).toBe('object');
    });
    it('key apiJsonFile is type object', () => {
        expect(typeof extractorConfig.apiJsonFile).toBe('object');
    });
});

describe('Interface IExtractorTsConfig', () => {
    let tsConfig: IExtractorTsConfig;
    beforeAll(() => {
        tsConfig = {
            rootFolder: process.cwd()
        }
    });
    it('is defined', () => {
        expect(tsConfig).toBeDefined();
    });
    it('contains the right keys', () => {
        expect(Object.keys(tsConfig)).toEqual(['rootFolder']);
    });
    it('key rootFolder is type string', () => {
        expect(typeof tsConfig.rootFolder).toBe('string');
    });
});

describe('Interface IExtractorProjectConfig', () => {
    let projectConfig: IExtractorProjectConfig;
    beforeAll(() => {
        projectConfig = {
            entryPoint: 'lib/index.d.ts'
        }
    });
    it('is defined', () => {
        expect(projectConfig).toBeDefined();
    });
    it('contains the right keys', () => {
        expect(Object.keys(projectConfig)).toEqual(['entryPoint']);
    });
    it('key entryPoint is type string', () => {
        expect(typeof projectConfig.entryPoint).toBe('string');
    });
});

describe('Interface IExtractorApiJsonConfig', () => {
    let apiJsonConfig: IExtractorApiJsonConfig;
    beforeAll(() => {
        apiJsonConfig = {
            enabled: true,
            outputFolder: 'temp'
        }
    });
    it('is defined', () => {
        expect(apiJsonConfig).toBeDefined();
    });

    it('contains the right keys', () => {
        expect(Object.keys(apiJsonConfig)).toEqual([
            'enabled',
            'outputFolder'
        ]);
    });

    it('key enabled is type boolean', () => {
        expect(typeof apiJsonConfig.enabled).toBe('boolean');
    });

    it('key rootFolder is type string', () => {
        expect(typeof apiJsonConfig.outputFolder).toBe('string');
    });
});

describe('Interface ITsConfig', () => {
    let tsConfig: ITsConfig;
    beforeAll(() => {
        tsConfig = {
            rootFolder: process.cwd(),
            tsConfig: {}
        }
    });
    it('is defined', () => {
        expect(tsConfig).toBeDefined();
    });
    it('contains the right keys', () => {
        expect(Object.keys(tsConfig)).toEqual(['rootFolder', 'tsConfig']);
    });
    it('key rootFolder is type string', () => {
        expect(typeof tsConfig.rootFolder).toBe('string');
    });
    it('key tsConfig is type object', () => {
        expect(typeof tsConfig.tsConfig).toBe('object');
    });
});

describe('Interface IProgram', () => {
    let program: IProgram;
    beforeAll(() => {
        const rootFolder: string = process.cwd();
        const commandLine: ParsedCommandLine = parseJsonConfigFileContent(
            {},
            sys,
            rootFolder
        );
        program = {
            rootFolder: rootFolder,
            program: createProgram([], commandLine.options)
        }
    });

    it('is defined', () => {
        expect(program).toBeDefined();
    });

    it('contains the right keys', () => {
        expect(Object.keys(program)).toEqual([
            'rootFolder',
            'program'
        ]);
    });

    it('key rootFolder is type string', () => {
        expect(typeof program.rootFolder).toBe('string');
    });

    it('key program is type object', () => {
        expect(typeof program.program).toBe('object');
    });
});