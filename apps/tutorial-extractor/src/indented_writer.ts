export class IndentedWriter {
    /**
   * The text characters used to create one level of indentation.
   * Two spaces by default.
   */
    spacing: string;

    private _output: string;
    private _indentStack: string[];
    private _needsIndent: boolean;
    private _indentText: string;
    constructor () {
        this.spacing = '  ';
        this._output = '';
        this._indentStack = [];
        this._indentText = '';
        this._needsIndent = true;
    }

    /**
   * Retrieves the indented output.
   */
    toString (): string {
        return this._output;
    }

    /**
   * Increases the indentation.  Normally the indentation is two spaces,
   * however an arbitrary prefix can optional be specified.  (For example,
   * the prefix could be "// " to indent and comment simultaneously.)
   * Each call to IndentedWriter.increaseIndent() must be followed by a
   * corresponding call to IndentedWriter.decreaseIndent().
   */
    increaseIndent (): void {
        this._indentStack.push(this.spacing);
        this._updateIndentText();
    }

    /**
     * Decreases the indentation, reverting the effect of the corresponding call
     * to IndentedWriter.increaseIndent().
     */
    decreaseIndent (): void {
        this._indentStack.pop();
        this._updateIndentText();
    }

    /**
     * Resets the stream, erasing any output and indentation levels.
     * Does not reset the "spacing" configuration.
     */
    clear (): void {
        this._output = '';
        this._indentStack = [];
        this._indentText = '';
        this._needsIndent = true;
    }
    /**
   * Writes some text to the internal string buffer, applying indentation according
   * to the current indentation level.  If the string contains multiple newlines,
   * each line will be indented separately.
   */
    write (message: string): void {
        let first = true;
        for (const linePart of message.split('\n')) {
            if (!first) {
                this._writeNewLine();
            } else {
                first = false;
            }
            if (linePart) {
                this._writeLinePart(linePart);
            }
        }
    }

    /**
  * A shorthand for writing an optional message, followed by a newline.
  * Indentation is applied following the semantics of IndentedWriter.write().
  */
    writeLine (message: string = ''): void {
        this.write(message + '\n');
    }

    private _writeLinePart (message: string): void {
        if (this._needsIndent) {
            this._output += this._indentText;
            this._needsIndent = false;
        }
        this._output += message.replace(/\r/g, '');
    }

    private _writeNewLine (): void {
        this._output += '\n';
        this._needsIndent = true;
    }

    private _updateIndentText (): void {
        this._indentText = this._indentStack.join('');
    }
}