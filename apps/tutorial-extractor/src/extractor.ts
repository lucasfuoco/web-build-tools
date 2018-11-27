import { JsonFile } from '@microsoft/node-core-library';
import * as fs from 'fs';
import * as fsx from 'fs-extra';
import * as path from 'path';
import { Observable, Observer } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import {
    createProgram,
    parseJsonConfigFileContent,
    sys,
    ParsedCommandLine,
    Program
} from 'typescript';
import {
    IExtractorApiJsonConfig,
    IExtractorConfig,
    IExtractorProjectConfig,
    IProgram,
    ITsConfig,
    ILogger
} from './extractor.types';
import { ExtractorContext } from './extractor_context/index';
import { TutorialJsonGenerator } from './generators/tutorial_json_generator';
import {MonitoredLogger} from './monitored_logger';
import colors = require('colors');
import lodash = require('lodash');

// tslint:disable-next-line:export-name
export class Extractor {
    private static _outputFileExtension: RegExp = /[^\.d]\.ts$/i;
    private static _defaultLogger: ILogger = {
        logVerbose: (message: string) => console.log('(Verbose) ' + message),
        logInfo: (message: string) => console.log(message),
        logWarning: (message: string) => console.warn(colors.yellow(message)),
        logError: (message: string) => console.error(colors.red(message))
    };
    private _config: IExtractorConfig;
    private _monitoredLogger: MonitoredLogger;
    private static _getSrcFiles (inputFilePaths: string[]): string[] {
        const files: string[] = [];
        const seenFiles: Set<string> = new Set<string>();
        const toUpperCase: (index: number) => string = (index: number) => inputFilePaths[index].toUpperCase();

        for (let i: number = 0; i < inputFilePaths.length; i++) {
            if (seenFiles.has(toUpperCase(i))) {
                continue;
            }
            if (!path.isAbsolute(inputFilePaths[i])) {
                throw new Error(
                    'Input file is not an absolute path: ' + inputFilePaths[i]
                );
            }
            if (Extractor._outputFileExtension.test(inputFilePaths[i])) {
                files.push(inputFilePaths[i]);
            }
        }
        return files;
    }
    constructor (config: IExtractorConfig) {
        this._config = config;
        let mergedLogger: ILogger;
        if (config && config.customLogger) {
            mergedLogger = lodash.merge(lodash.clone(Extractor._defaultLogger), config.customLogger);
        } else {
        mergedLogger = Extractor._defaultLogger;
    }
        this._monitoredLogger = new MonitoredLogger(mergedLogger);
    }
    public init (): void {
        this._getAbsRootFolder(this._config.compiler.rootFolder).pipe(
            concatMap((rootFolder: string) => this._getTsConfig(rootFolder)),
            concatMap((tsConfig: ITsConfig) => this._getProgram(tsConfig)),
            concatMap((program: IProgram) => this._processProject(program))
        ).subscribe(
            (response: string) => {
                console.log(response);
            },
            (err: Error) => {
                throw err;
            }
        );
    }

    private _getAbsRootFolder (rootFolder: string): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            fs.exists(rootFolder, (exists: boolean) => {
                if (!exists) {
                    observer.error(
                        new Error('The root folder does not exist: ' + rootFolder)
                    );
                }
                observer.next(path.normalize(path.resolve(rootFolder)));
                observer.complete();
            });
        });
    }

    private _getTsConfig (rootFolder: string): Observable<ITsConfig> {
        return Observable.create((observer: Observer<ITsConfig>) => {
            const configPath: string = path.join(rootFolder, 'tsconfig.json');
            const tsConfig: {} = JsonFile.load(configPath);
            if (!tsConfig) {
                observer.error(
                    new Error('The tsconfig.json does not exist:' + configPath)
                );
            }
            observer.next({ rootFolder, tsConfig });
            observer.complete();
        });
    }

    private _getProgram (tsConfig: ITsConfig): Observable<IProgram> {
        return Observable.create((observer: Observer<IProgram>) => {
            const commandLine: ParsedCommandLine = parseJsonConfigFileContent(
                tsConfig.tsConfig,
                sys,
                tsConfig.rootFolder
            );
            if (commandLine.errors.length > 0) {
                observer.error(
                    'Error parsing tsconfig.json content: ' +
                    commandLine.errors[0].messageText
                );
            }
            const normalizeEntryPointFile: string = path.normalize(
                path.resolve(tsConfig.rootFolder, this._config.project.entryPoint)
            );
            const filePaths: string[] = Extractor._getSrcFiles(
                commandLine.fileNames.concat(normalizeEntryPointFile)
            );
            const program: Program = createProgram(filePaths, commandLine.options);
            observer.next({ rootFolder: tsConfig.rootFolder, program: program });
            observer.complete();
        });
    }

    private _processProject (program: IProgram): Observable<string> {
        return Observable.create((observer: Observer<string>) => {
            const projectConfig: IExtractorProjectConfig = this._config.project;
            if (
                !Extractor._outputFileExtension.test(this._config.project.entryPoint)
            ) {
                observer.error(
                    new Error(
                        'The entry point is not a typescript file: ' +
                        this._config.project.entryPoint
                    )
                );
            }

            const context: ExtractorContext = new ExtractorContext({
                program: program.program,
                entryPointFile: path.resolve(
                    program.rootFolder,
                    projectConfig.entryPoint
                ),
                logger: this._monitoredLogger
            });

            const packageBaseName: string = path.basename(context.packageName);
            const apiJsonFileConfig: IExtractorApiJsonConfig = this._config.apiJsonFile;
            if (apiJsonFileConfig.enabled) {
                const outputFolder: string = path.resolve(
                    program.rootFolder,
                    apiJsonFileConfig.outputFolder
                );
                const jsonGenerator: TutorialJsonGenerator = new TutorialJsonGenerator();
                const apiJsonFilename: string = path.join(outputFolder, packageBaseName + '.api.json');
                observer.next('Writing: ' + apiJsonFilename);
                fsx.mkdirs(path.dirname(apiJsonFilename), (err: Error) => {
                    observer.error(err);
                });
                jsonGenerator.writeJsonFile(apiJsonFilename, context);
                observer.next(`Successfully wrote \"${apiJsonFilename}\"`);
            } else {
                observer.next(`Unsuccessfully wrote \"${packageBaseName}\".` +
                ` Try setting the extractor json config to \"enabled\".`);
            }
            observer.complete();
        });
    }
}
