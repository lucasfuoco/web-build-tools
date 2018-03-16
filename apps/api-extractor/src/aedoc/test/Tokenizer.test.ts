// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { Token, TokenType } from '../Token';
import { Tokenizer } from '../Tokenizer';

/* tslint:disable:no-function-expression - Mocha uses a poorly scoped "this" pointer */

/**
 * Dummy class wrapping Tokenizer to test its protected methods
 */
class TestTokenizer extends Tokenizer {
  constructor(docs: string, reportError: (message: string) => void) {
    super(docs, reportError);
  }

  public tokenizeDocs(docs: string): Token[] {
    return this._tokenizeDocs(docs);
  }

  public tokenizeInline(docs: string): Token | undefined {
    return this._tokenizeInline(docs);
  }
}

describe('Tokenizer tests', function (): void {
  describe('Tokenizer methods', function (): void {
    const testTokenizer: TestTokenizer = new TestTokenizer('', console.log);

    it('tokenizeDocs()', function (): void {
      const docs: string = `this is a mock documentation\n @taga hi\r\n @tagb hello @invalid@tag email@domain.com
        @tagc this is {   @inlineTag param1  param2   } and this is {just curly braces}`;

      const expectedTokens: Token[] = [
        new Token(TokenType.Text, '', 'this is a mock documentation\n'),
        new Token(TokenType.BlockTag, '@taga'),
        new Token(TokenType.Text, '', ' hi\n'),
        new Token(TokenType.BlockTag, '@tagb'),
        new Token(TokenType.Text, '', ' hello @invalid@tag email@domain.com\n       '),
        new Token(TokenType.BlockTag, '@tagc'),
        new Token(TokenType.Text, '', ' this is '),
        new Token(TokenType.Text, '', ' and this is {just curly braces}')
      ];

      const actualTokens: Token[] = testTokenizer.tokenizeDocs(docs);
      expect(actualTokens).toEqual(expectedTokens);
    });

    it('tokenizeInline()', function (): void {
      const token: string = '{    @link   https://bing.com  |  Bing  }';
      const expectedToken: Token = new Token(TokenType.InlineTag, '@link', 'https://bing.com | Bing');
      const actualToken: Token | undefined = testTokenizer.tokenizeInline(token);
      expect(actualToken!.type).toBe(expectedToken.type);
      expect(actualToken!.tag).toBe(expectedToken.tag);
      expect(actualToken!.text).toBe(expectedToken.text);
    });
  });
});
