import {
    LineAndCharacter,
    Node,
    Program,
    SourceFile
} from 'typescript';
import { UtilPrettyPrinter } from '@ossiaco/tutorial-extractor';
import { UTIL_GetExtractorContext } from '../utils/util_extractor_context';

describe('Class UtilPrettyPrinter', () => {
    let formatFileAndLineNumber: string;
    let sourceFile: SourceFile;
    let lineAndCharacter: LineAndCharacter;
    let message: string;
    let rootFile: SourceFile | undefined;
    beforeAll(() => {
        const program: Program = UTIL_GetExtractorContext().program;
        const entryPointFile: string = UTIL_GetExtractorContext().entryPointFile;
        rootFile = program.getSourceFile(entryPointFile);
        message = 'Unable to determine the semantic information for this declaration';
        sourceFile = rootFile!.getSourceFile();
        lineAndCharacter = sourceFile.getLineAndCharacterOfPosition(rootFile!.getStart());
        formatFileAndLineNumber = UtilPrettyPrinter.formatFileAndLineNumber(rootFile as Node);
    });

    it('is defined', () => {
        expect(UtilPrettyPrinter).toBeDefined();
    });

    it('has method throwUnexpectedSyntaxError', () => {
        expect(() => {
            UtilPrettyPrinter.throwUnexpectedSyntaxError(
                rootFile as Node,
                message
            );
        }).toThrowError(`[${sourceFile.fileName}#${lineAndCharacter.line}]: ${message}`);
    });

    it('had method formatFileAndLineNumber', () => {
        expect(formatFileAndLineNumber).toBeDefined();
    });

    it('method formatFileAndNumber is type string', () => {
        expect(typeof formatFileAndLineNumber).toBe('string');
    });

    it('method formatFileAndNumber returns the correct formated error message', () => {
        expect(formatFileAndLineNumber).toBe(`[${sourceFile.fileName}#${lineAndCharacter.line}]`);
    });
});