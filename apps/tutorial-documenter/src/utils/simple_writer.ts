/** Helper class used by MarkdownPageRender */
// tslint:disable-next-line:export-name
export class SimpleWriter {
    private _buffer: string = '';

    public write(s: string): void {
        this._buffer += s;
    }

    public writeLine(s: string = ''): void {
        this._buffer += s + '\n';
    }

    /** Adds a newline if the file pointer is not already at the start of the line */
    public ensureNewLine(): void {
        if (this.peekLastCharacter() !== '\n') {
            this.write('\n');
        }
    }

    /** Adds up to two newlines to ensure that there is a blank line above the current line. */
    public ensureSkippedLine(): void {
        this.ensureNewLine();
        if (this.peekSecondLastCharacter() !== '\n') {
            this.write('\n');
        }
    }

    public peekLastCharacter(): string {
        return this._buffer.substr(-1, 1);
    }

    public peekSecondLastCharacter(): string {
        return this._buffer.substr(-2, 1);
    }

    public toString(): string {
        return this._buffer;
    }
}