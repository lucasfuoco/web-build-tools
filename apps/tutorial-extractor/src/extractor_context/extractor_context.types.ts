import { Program } from 'typescript';
import {ILogger} from '../extractor.types';

/**
 * Options for ExtractorContext
 */
export interface IExtractorContextOptions {
    /**
     * Configuration for the typescript compiler. The most important are:
     * - target
     * - module
     * - moduleResolution
     * - rootDir
     */
    program: Program;
    /**
     * The entry point for the project. The "main" field from the NPM's package.json file.
     */
    entryPointFile: string;
    logger: ILogger;
}