import {
    createProgram,
    parseJsonConfigFileContent,
    sys,
    ParsedCommandLine
} from 'typescript';
import {
    MonitoredLogger,
    IExtractorContextOptions
} from '@ossiaco/tutorial-extractor';
import colors = require('colors');

describe('Interface IExtractorContextOptions', () => {
    let extractorContextOptions: IExtractorContextOptions;
    beforeAll(() => {
        const commandLine: ParsedCommandLine = parseJsonConfigFileContent(
            {},
            sys,
            './src'
        );
        extractorContextOptions = {
            program: createProgram([], commandLine.options),
            entryPointFile: './src',
            logger: new MonitoredLogger({
                logVerbose: (message: string) => console.log('(Verbose) ' + message),
                logInfo: (message: string) => console.log(message),
                logWarning: (message: string) => console.warn(colors.yellow(message)),
                logError: (message: string) => console.error(colors.red(message))
            })
        }
    });

    it('is defined', () => {
        expect(extractorContextOptions).toBeDefined();
    });

    it('contains the right keys', () => {
        expect(Object.keys(extractorContextOptions)).toEqual([
            'program',
            'entryPointFile'
        ]);
    });

    it('key program is type object', () => {
        expect(typeof extractorContextOptions.program).toBe('object');
    });

    it('key entryPointFile is type string', () => {
        expect(typeof extractorContextOptions.entryPointFile).toBe('string');
    });
});