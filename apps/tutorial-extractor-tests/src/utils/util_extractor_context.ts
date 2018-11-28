/**
 * @public
 * @tutorial
 * @tutorialname Nothing
 */

import { JsonFile } from '@microsoft/node-core-library';
import * as path from 'path';
import {
    createProgram,
    parseJsonConfigFileContent,
    sys,
    ParsedCommandLine,
    Program
} from 'typescript';
import {
    MonitoredLogger,
    ExtractorContext
} from '@ossiaco/tutorial-extractor';
import colors = require('colors');

const rootFolder: string = process.cwd();
const files: string[] = [path.resolve(rootFolder, 'src/index.ts')];
const configPath: string = path.join(rootFolder, 'tsconfig.json');
const tsConfig: {} = JsonFile.load(configPath);
const commandLine: ParsedCommandLine = parseJsonConfigFileContent(
    tsConfig,
    sys,
    rootFolder
);
const program: Program = createProgram(files, commandLine.options);

const instance: ExtractorContext = new ExtractorContext({
    program: program,
    entryPointFile: path.resolve(rootFolder, 'src/index.ts'),
    logger: new MonitoredLogger({
        logVerbose: (message: string) => console.log('(Verbose) ' + message),
        logInfo: (message: string) => console.log(message),
        logWarning: (message: string) => console.warn(colors.yellow(message)),
        logError: (message: string) => console.error(colors.red(message))
    })
});

/** Get the instance of ExtractorContext. */
// tslint:disable-next-line:export-name
export function UTIL_GetExtractorContext (): ExtractorContext {
    return instance;
}