import {
    Token,
    Tokenizer
} from '@ossiaco/tutorial-extractor';

describe('Class Tokenizer', () => {
    let instance: Tokenizer;
    let reportError: (message: string) => Error;
    let peekToken: Token | undefined;
    let getToken: Token | undefined;
    let badJsDocTokenizer: () => Tokenizer;
    beforeAll(() => {
        const jsDocContent: string = `/**
            * @public
            * @tutorial
            * @tutorialname Load Context
            * Load the runtime context.
            * @note blah blah blah
        */`;
        const badJsDocContent: string = `/**
            * @public
            * @tutorial
            * @tutorialname Load Context
            * Load the runtime context.
            * @note {@link}
        */`;
        reportError = (message: string) => {
            throw new Error(message);
        };
        instance = new Tokenizer(jsDocContent, reportError);
        peekToken = instance.peekToken();
        getToken = instance.getToken();
        badJsDocTokenizer = () => new Tokenizer(badJsDocContent, reportError);
    });

    it ('is defined', () => {
        expect(instance).toBeDefined();
    });

    it ('is an instance of Tokenizer', () => {
        expect(instance instanceof Tokenizer).toBeTruthy();
    });

    it('bad js doc content in Tokenizer instance throw an error', () => {
        expect(() => {
            badJsDocTokenizer();
        }).toThrow(new Error('The {@link} tag must include a URL or API item reference'));
    });

    it('has method peekToken', () => {
        expect(peekToken).toBeDefined();
    });

    it('method peekToken is an instance of Token', () => {
        expect(peekToken instanceof Token).toBeTruthy();
    });

    it('has method getToken', () => {
        expect(getToken).toBeDefined();
    });

    it('method getToken is an instance of Token', () => {
        expect(getToken instanceof Token).toBeTruthy();
    });
});