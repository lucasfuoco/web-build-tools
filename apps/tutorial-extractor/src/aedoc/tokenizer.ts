import {
    UtilTypescriptHelpers
} from '../utils/index';
import {Token, TokenType} from './token';

/** Handles the tokenizatipon of an AEDoc comment */
// tslint:disable-next-line:export-name
export class Tokenizer {
    /**
   * Match AEDoc block tags and inline tags
   * Example "@a @b@c d@e @f {whatever} {@link a} { @something } \@g" => ["@a", "@f", "{@link a}", "{ @something }"]
   */
    private static _aedocTagsRegex: RegExp = /{\s*@(\\{|\\}|[^{}])*}|(?:^|\s)(\@[a-z_]+)(?=\s|$)/gi;
    /**
     * Match comments and typescript code
     */
    private static _commentsAndCodeRegEx: RegExp = /(\/\*\*[\s\S]*?\*\/)/gm;
    /** Match comments */
    private static _commentsRegEx: RegExp = /\/\*\*[\s\S]*?\*\//gm;
    /** List of Tokens that have been tokenized. */
    private _tokenStream: Token[];
    private _reportError: (message: string) => void;
    constructor(docs: string, reportError: (message: string) => void) {
        this._reportError = reportError;
        this._tokenStream = this._tokenizeDocs(docs);
    }

    public peekToken(): Token | undefined {
        return (!this._tokenStream || this._tokenStream.length === 0) ? undefined : this._tokenStream[0];
    }

    public getToken(): Token | undefined {
        return (!this._tokenStream || this._tokenStream.length === 0) ? undefined : this._tokenStream.shift();
    }

    /**
     * Converts a doc comment string into an array of Tokens. This processing is done so that docs
     * can be processed more strictly.
     */
    protected _tokenizeDocs(docs: string): Token[] {
        if (!docs.length) {
            return [];
        }

        let docEntries: string[] = [];
        const commentsAndCode: string[] = docs.split(Tokenizer._commentsAndCodeRegEx);

        for (let i: number = 0; i < commentsAndCode.length; ++i) {
            if (Tokenizer._commentsRegEx.test(commentsAndCode[i])) {
                // This will be the AEDoc content, excluding the "/**" characters
                const aedocs: string = UtilTypescriptHelpers.extractJSDocContent(commentsAndCode[i], this._reportError);
                docEntries = docEntries.concat(
                    UtilTypescriptHelpers.splitStringWithRegEx(
                        aedocs.replace(/\r/g, ''),
                        Tokenizer._aedocTagsRegex
                    )
                );
            } else {
                if (commentsAndCode[i].trim().length === 0) {
                    continue;
                }
                docEntries.push('@code');
                docEntries.push(commentsAndCode[i].replace(/\r/g, ''));
            }
        }

        // process each sanitized doc string to a Token object
        const tokens: Token[] = [];

        for (let i: number = 0; i < docEntries.length; i++) {
            let token: Token | undefined;
            const untrimmed: string = docEntries[i];
            const trimmed: string = untrimmed.replace(/\s+/g, ' ').trim();
            if (trimmed.charAt(0) === '@') {
                token = new Token(TokenType.BlockTag, trimmed);
            } else if (trimmed.charAt(0) === '{' && trimmed.charAt(trimmed.length - 1) === '}') {
                token = this._tokenizeInline(trimmed);
            } else if (untrimmed.length) {
                // If it's not a tag, pass through the untrimmed text.
                token = new Token(TokenType.Text, '', untrimmed);
            }

            if (token) {
                tokens.push(token);
            }
        }
        return tokens;
    }

    /**
   * Parse an inline tag and returns the Token for it if itis a valid inline tag.
   * Example '{@link https://bing.com | Bing}' => '{type: 'Inline', tag: '@link', text: 'https://bing.com  | Bing'}'
   */
  protected _tokenizeInline(docEntry: string): Token | undefined {
      if (docEntry.charAt(0) !== '{' || docEntry.charAt(docEntry.length - 1) !== '}') {
          // This is a program bug, since _tokenizeDocs() checks this condition before calling
          this._reportError('The AEDoc tag is not enclosed in "{" and "}"');
      }
      const tokenContent: string = docEntry.slice(1, docEntry.length - 1).trim();

      if (tokenContent.charAt(0) !== '@') {
          // This is a program bug since it should of been already validated by the Tokenizer
          this._reportError('The AEDoc tag does not start with "@".');
            return undefined;
      }

      const unescapedCurlyBraces: RegExp = /([^\\])({|}[^$])/gi;
      if (unescapedCurlyBraces.test(tokenContent)) {
          this._reportError(`An escaped "{" or "}" character was found inside an inline tag. ` +
          'Use a backslash ("\\") to escape curly braces');
          return undefined;
      }

      // Split the inline tag content with whitespace
      // Example: '@link    https://bing.com  |  Bing' => ['@link', 'https://bing.com', '|', 'Bing']
      const tokenChunks: string[] = tokenContent.split(/\s+/gi);
      if (tokenChunks[0] === '@link') {
          if (tokenChunks.length < 2) {
              this._reportError('The {@link} tag must include a URL or API item reference');
              return undefined;
          }

          tokenChunks.shift(); // Gets rid of '@link'
          const token: Token = new Token(TokenType.InlineTag, '@link', tokenChunks.join(' '));
          return token;
      } else if (tokenChunks[0] === '@inheritdoc') {
          tokenChunks.shift(); // Gets rid of '@inheritdoc'
          const token: Token = new Token(TokenType.InlineTag, '@inheritdoc', tokenChunks.join(' '));
          return token;
      }

      // This is a program bug
      this._reportError('Invalid call to _tokenizeInline()');
      return undefined;
  }
}