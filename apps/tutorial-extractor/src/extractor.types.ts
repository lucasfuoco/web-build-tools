import { Program } from 'typescript';
/**
 * The typescript compiler configuration
 */
export interface IExtractorTsConfig {
    /** The root folder for the project */
    rootFolder: string;
}

/** The project configuration  */
export interface IExtractorProjectConfig {
    /** The typescript *.d.ts entry file */
    entryPoint: string;
}

/** The API JSON file configuration */
export interface IExtractorApiJsonConfig {
    /** Whether to generate API JSON files at all. */
    enabled: boolean;
    outputFolder: string;
}

export interface IExtractorConfig {
    /** A typescript compiler configuration */
    compiler: IExtractorTsConfig;
    /** The project configuration */
    project: IExtractorProjectConfig;
    /** The API JSON file configuration */
    apiJsonFile: IExtractorApiJsonConfig;
    /**
     * Allows the caller to handle API Extractor errors; otherwise, they will be logged
     * to the console.
    */
    customLogger?: Partial<ILogger>;
}

export interface ITsConfig {
    rootFolder: string;
    tsConfig: Object;
}

export interface IProgram {
    rootFolder: string;
    program: Program;
}

export interface ILogger {
    /** Log a message that will only be shown in a "verbose" logging mode. */
    logVerbose(message: string): void;
    /** Log a normal message. */
    logInfo(message: string): void;
    /** Log a warning message.  Typically it is shown in yellow and will break a production build. */
    logWarning(message: string): void;
    /** Log an error message.  Typically it is shown in red and will break a production build. */
    logError(message: string): void;
}