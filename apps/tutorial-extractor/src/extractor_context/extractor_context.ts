import { PackageJsonLookup, IPackageJson } from '@microsoft/node-core-library';
import * as path from 'path';
import { LineAndCharacter, Program, SourceFile, TypeChecker } from 'typescript';
import { AstPackage } from '../ast/index';
import { DocItemLoader } from '../doc_item_loader';
import { IExtractorContextOptions } from './extractor_context.types';
import { ILogger } from '../extractor.types';

// tslint:disable-next-line:export-name
export class ExtractorContext {
    public package: AstPackage;
    /**
   * One DocItemLoader is needed per analyzer to look up external API members
   * as needed.
   */
    public readonly docItemLoader: DocItemLoader;
    public readonly typeChecker: TypeChecker;
    public readonly program: Program;
    public readonly entryPointFile: string;

    private _packageFolder: string;
    private _packageName: string;
    private _logger: ILogger;
    constructor (options: IExtractorContextOptions) {
        const packageJsonLookup: PackageJsonLookup = new PackageJsonLookup();

        const folder: string | undefined = packageJsonLookup.tryGetPackageFolderFor(
            options.entryPointFile
        );
        if (!folder) {
            throw new Error(
                'Unable to find a package.json for entry point: ' +
                options.entryPointFile
            );
        }
        this._packageFolder = folder;
        const jsonPackage: IPackageJson = packageJsonLookup.loadPackageJson(
            path.resolve(folder, 'package.json')
        );

        this._packageName = jsonPackage.name;
        this._logger = options.logger;

        // This run a full type analysis, and then augments the Abstract Syntax Tree
        // with semantic information.
        for (const diagnostic of options.program.getSemanticDiagnostics()) {
            this.reportError(
                'TypeScript: ' + diagnostic.messageText,
                diagnostic.file,
                diagnostic.start
            );
        }

        this.typeChecker = options.program.getTypeChecker();
        this.program = options.program;
        this.entryPointFile = options.entryPointFile;
        this.docItemLoader = new DocItemLoader();

        const rootFile: SourceFile | undefined = options.program.getSourceFile(
            options.entryPointFile
        );
        if (!rootFile) {
            throw Error('Unable to load file: ' + options.entryPointFile);
        }

        this.package = new AstPackage(this, rootFile);
        this.package.completeInitialization(); // creates ApiDocumentation
        this.package.visitTypeReferencesForAstItem();
        this.reportWarnings();
    }

    /**
     * Returns the folder for the package being analysed.
     */
    get packageFolder (): string {
        return this._packageFolder;
    }

    /**
     * Returns the full name of the package being analysed.
     */
    get packageName (): string {
        return this._packageName;
    }

    /**
     * Reports an error message to the registered ApiErrorHandler
     */
    public reportError (
        message: string,
        sourceFile: SourceFile | undefined,
        start: number | undefined
    ): void {
        if (sourceFile && start) {
            const lineAndCharacter: LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(start);

            // If the file is under the packageFolder, then show a relative path
            const relativePath: string = path.relative(
                this.packageFolder,
                sourceFile.fileName
            );
            const shownPath: string =
                relativePath.substr(0, 2) === '..' ? sourceFile.fileName : relativePath;

            // Format the error. For example:
            // "src\MyClass.ts(15,1): The JSDoc tag "@blah" is not supported"
            this._logger.logError(
                `${shownPath}(${lineAndCharacter.line +
                1}, ${lineAndCharacter.character + 1}): ${message}`
            );
        } else {
            this._logger.logError(message);
        }
    }

    /** Report all warnings */
    public reportWarnings (): void {
        const { warnings } = this.package;
        warnings.map((warning: string) => {
            this._logger.logWarning(warning);
        });
    }
}
