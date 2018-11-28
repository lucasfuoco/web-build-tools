import {
    Token,
     TokenType
} from '@ossiaco/tutorial-extractor';

describe('Class Token', () => {
    let instance: Token;
    beforeAll((done: jest.DoneCallback) => {
        instance = new Token(TokenType.BlockTag, '@param', 'This is a test message \\{\\@link \\\\ \\}');
        done();
    });

    it('has method type', () => {
        expect(instance.type).toBeDefined();
    });

    it('method type is type number', () => {
        expect(typeof instance.type).toBe('number');
    });

    it('method type returns token type BlockTag', () => {
        expect(instance.type).toEqual(TokenType.BlockTag);
    });

    it('has method tag', () => {
        expect(instance.tag).toBeDefined();
    });

    it('method tag is type string', () => {
        expect(typeof instance.tag).toBe('string');
    });

    it('method tag returns the right tag', () => {
        expect(instance.tag).toEqual('@param');
    });

    it('has method text', () => {
        expect(instance.text).toBeDefined();
    });

    it('method text is type string', () => {
        expect(typeof instance.text).toBe('string');
    });

    it('method text returns the right text', () => {
        expect(instance.text).toBe('This is a test message {@link \\ }');
    });

    it('method requireType throws error on different token type', () => {
        expect(() => {
            instance.requireType(TokenType.InlineTag);
        }).toThrow(new Error(
            `Encountered a token of type \"${TokenType.BlockTag}\" when expecting \"${TokenType.InlineTag}\"`
        ));
    });
});