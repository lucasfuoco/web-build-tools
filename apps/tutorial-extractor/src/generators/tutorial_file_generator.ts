import * as fs from 'fs';
import { AstPackage } from '../ast/ast_package';
import { AstItem } from '../ast/index';
import { IndentedWriter } from '../indented_writer';

// tslint:disable-next-line:export-name
export class ApiFileGenerator {
    protected _indentedWriter: IndentedWriter = new IndentedWriter();
    // tslint:disable-next-line:no-empty
    constructor () { }

    /**
   * Generates the report and writes it to disk.
   *
   * @param reportFilename - The output filename
   * @param analyzer       - An Analyzer object representing the input project.
   */
    public writeApiFile (reportFilename: string): void {
        const fileContent: string = this.generateApiFileContent();
        fs.writeFileSync(reportFilename, fileContent);
    }

    public generateApiFileContent (): string {
        const fileContent: string = this._indentedWriter.toString().replace(/\r?\n/g, '\r\n');
        return fileContent;
    }

    protected visitAstPackage (astPackage: AstPackage): void {
        this._writeAedocSynopsis(astPackage);
    }

    /**
     * Writes a synopsis of the AEDoc comments, which indicates the release tag,
     * whether the item has been documented, and any warnings that were detected
     * by the analysis.
     */
    private _writeAedocSynopsis (astItem: AstItem): void {
        this._writeWarnings(astItem);
    }

    private _writeWarnings (astItem: AstItem): void {
        const lines: string[] = astItem.warnings.map((x: string) => 'WARNING: ' + x);
        this._writeLinesAsComments(lines);
    }

    private _writeLinesAsComments (lines: string[]): void {
        if (lines.length) {
            // Write the lines prefixed by slashes. If there are multiple line , add "//" to each line
            this._indentedWriter.write('// ');
            this._indentedWriter.write(lines.join('\n//'));
            this._indentedWriter.writeLine();
        }
    }
}