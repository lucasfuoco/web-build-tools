import { LineAndCharacter, Node, SourceFile } from 'typescript';

export class UtilPrettyPrinter {
    /** Throws an exception. */
    static throwUnexpectedSyntaxError (errorNode: Node, message: string): void {
        if (!errorNode) {
            throw new Error(`[undefined]: ${message}`);
        } else {
            throw new Error(`${UtilPrettyPrinter.formatFileAndLineNumber(errorNode)}: ${message}`);
        }
    }
    /** Returns a string such as this: [c:\Folder\File.ts#123] */
    static formatFileAndLineNumber (node: Node): string {
        const sourceFile: SourceFile = node.getSourceFile();
        const lineAndCharacter: LineAndCharacter = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        return `[${sourceFile.fileName}#${lineAndCharacter.line}]`;
    }
}