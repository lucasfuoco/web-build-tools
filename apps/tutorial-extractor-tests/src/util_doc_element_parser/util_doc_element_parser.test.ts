import {
    ApiDocumentation,
    ExtractorContext,
    Token,
    Tokenizer,
    TokenType,
    IMarkupApiLink,
    MarkupBasicElement,
    MarkupElement,
    UtilDocElementParser
} from '@ossiaco/tutorial-extractor';
import {UTIL_GetApiDocumentation} from '../utils/util_api_documentation';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';
import {UTIL_GetTokenizer} from '../utils/util_tokenizer';

describe('Class UtilDocElementParser', () => {
    let parseInteger: number | undefined;
    let parseIntegerNull: number | undefined;
    let badStepIndexTagApiDocumentation: () => ApiDocumentation;
    let badStepIndexTagTokenizer: () => Tokenizer;
    let parse: MarkupBasicElement[];
    let parseBlockTag: MarkupBasicElement[];
    let parseTextTag: MarkupBasicElement[];
    let inheritdocInlineTagApiDocumentation: ApiDocumentation;
    let linkInlineTagApiDocumentation: ApiDocumentation;
    let parseLinkInlineTag: MarkupBasicElement[];
    let parseCode: MarkupElement[];
    let parseAndNormalize: MarkupBasicElement[];
    let parseWebLinkTag: MarkupBasicElement | undefined;
    let parseApiLinkTag: MarkupBasicElement | undefined;
    let parseSteps: string[];
    let parseStepsWithoutStart: () => string[];
    let parseStepsWithoutEnd: () => string[];
    beforeAll(() => {
        const context: ExtractorContext = UTIL_GetExtractorContext();
        const reportError: (message: string) => void = (message: string) => {
            throw new Error(message);
        };
        const stepIndexTag: string = `
            /**
             * @stepindex 1
            */
        `;
        const stepIndexTagNull: string = `
            /**
             * @stepindex
            */
        `;
        const badStepIndexTag: string = `
            /**
             * @stepindex []
            */
        `;
        const blockTag: string = `
            /**
             * @tutorial
             * @public
             */
        `;
        const textTag: string = `
            /**
             * @tutorial
             * @remarks This is a test message.
            */
        `;
        const inheritdocInlineTag: string = `
            /**
             * {@inheritdoc UTIL_GetExtractorContext()}
            */
        `;
        const linkInlineTag: string = `
            /**
             * @tutorial
             * @summary Checkout this {@link https://microsoft.com | Microsoft}
             * Checkout this external package ` +
             `{@link @ossiaco/tutorial-extractor-tests:UTIL_GetExtractorContext | Ossiaco}
            */
        `;
        const webLinkTag: string = `
            /**
             * @tutorial
             * @summary Checkout this {@link https://microsoft.com | Microsoft}
            */
        `;
        const apiLinkTag: string = `
            /**
             * @tutorial
             * @summary Checkout this external package ` +
             `{@link @ossiaco/tutorial-extractor-tests:UTIL_GetExtractorContext | Ossiaco}
            */
        `;
        const codeTag: string = `
            /**
             * @tutorial
            */
           import * as fs from 'fs';
        `;

        const stepIndexTagApiDocumentation: ApiDocumentation = new ApiDocumentation(
            stepIndexTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        const stepIndexTagNullApiDocumentation: ApiDocumentation = new ApiDocumentation(
            stepIndexTagNull,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        badStepIndexTagApiDocumentation = () => new ApiDocumentation(
            badStepIndexTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        const blockTagApiDocumentation: ApiDocumentation = new ApiDocumentation(
            blockTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        const textTagApiDocumentation: ApiDocumentation = new ApiDocumentation(
            textTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        inheritdocInlineTagApiDocumentation = new ApiDocumentation(
            inheritdocInlineTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        linkInlineTagApiDocumentation = new ApiDocumentation(
            linkInlineTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        const parseWebLinkTagApiDocumentation: ApiDocumentation = new ApiDocumentation(
            webLinkTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        const parseApiLinkTagApiDocumentation: ApiDocumentation = new ApiDocumentation(
            apiLinkTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        const parseCodeTagApiDocumentation: ApiDocumentation = new ApiDocumentation(
            codeTag,
            context.docItemLoader,
            context,
            reportError,
            []
        );

        const stepIndexTagTokenizer: Tokenizer = new Tokenizer(stepIndexTag, reportError);
        const stepIndexTagNullTokenizer: Tokenizer = new Tokenizer(stepIndexTagNull, reportError);
        badStepIndexTagTokenizer = () => new Tokenizer(badStepIndexTag, reportError);
        const blockTagTokenizer: Tokenizer = new Tokenizer(blockTag, reportError);
        const textTagTokenizer: Tokenizer = new Tokenizer(textTag, reportError);
        const inheritdocInlineTagTokenizer: Tokenizer = new Tokenizer(inheritdocInlineTag, reportError);
        const linkInlineTagTokenizer: Tokenizer = new Tokenizer(linkInlineTag, reportError);
        const parseWebLinkTagTokenizer: Tokenizer = new Tokenizer(webLinkTag, reportError);
        const parseApiLinkTagTokenizer: Tokenizer = new Tokenizer(apiLinkTag, reportError);
        const parseCodeTagTokenizer: Tokenizer = new Tokenizer(codeTag, reportError);

        // getToken is initialized when a block or inline tag contains text
        stepIndexTagTokenizer.getToken();
        stepIndexTagNullTokenizer.getToken();
        blockTagTokenizer.getToken();
        inheritdocInlineTagTokenizer.getToken();
        // Twice
        linkInlineTagTokenizer.getToken();
        linkInlineTagTokenizer.getToken();
        // Twice
        textTagTokenizer.getToken();
        textTagTokenizer.getToken();
        // Thrice
        parseWebLinkTagTokenizer.getToken();
        parseWebLinkTagTokenizer.getToken();
        parseWebLinkTagTokenizer.getToken();
        // Thrice
        parseApiLinkTagTokenizer.getToken();
        parseApiLinkTagTokenizer.getToken();
        parseApiLinkTagTokenizer.getToken();
        // Twice
        parseCodeTagTokenizer.getToken();
        parseCodeTagTokenizer.getToken();

        parseInteger = UtilDocElementParser.parseInteger(stepIndexTagApiDocumentation, stepIndexTagTokenizer);
        parseIntegerNull = UtilDocElementParser.parseInteger(
            stepIndexTagNullApiDocumentation,
            stepIndexTagNullTokenizer
        );
        parse = UtilDocElementParser.parse(UTIL_GetApiDocumentation(), UTIL_GetTokenizer());
        parseBlockTag = UtilDocElementParser.parse(blockTagApiDocumentation, blockTagTokenizer);
        parseTextTag = UtilDocElementParser.parse(textTagApiDocumentation, textTagTokenizer);
        parseLinkInlineTag = UtilDocElementParser.parse(linkInlineTagApiDocumentation, linkInlineTagTokenizer);
        parseAndNormalize = UtilDocElementParser.parseAndNormalize(UTIL_GetApiDocumentation(), UTIL_GetTokenizer());
        parseWebLinkTag = UtilDocElementParser.parseLinkTag(
            parseWebLinkTagApiDocumentation,
            parseWebLinkTagTokenizer.peekToken() as Token
        );
        parseApiLinkTag = UtilDocElementParser.parseLinkTag(
            parseApiLinkTagApiDocumentation,
            parseApiLinkTagTokenizer.peekToken() as Token
        );
        parseCode = UtilDocElementParser.parseCode(parseCodeTagApiDocumentation, parseCodeTagTokenizer);

        const stepsWithoutStart: string = `
            /**
             * @public
            */
            /**
             * @stepend
            */
        `;
        const stepsWithoutEnd: string = `
            /**
             * @stepstart
            */
           /**
            * @codedescription
           */
        `;
        const steps: string = `
            /**
             * @tutorial
             * @tutorialname Test
            */
            /**
             * @stepstart
             * @stepindex 1
            */
           import * as Test from './test';
           /**
            * @stepend
           */
        `;
        parseSteps = UtilDocElementParser.parseSteps(steps, reportError);
        parseStepsWithoutStart = () => UtilDocElementParser.parseSteps(stepsWithoutStart, reportError);
        parseStepsWithoutEnd = () => UtilDocElementParser.parseSteps(stepsWithoutEnd, reportError);

        // This initialization changes values in the ApiDocumentation instance
        UtilDocElementParser.parse(inheritdocInlineTagApiDocumentation, inheritdocInlineTagTokenizer);
    });

    it('has method parseInterger', () => {
        expect(parseInteger).toBeDefined();
    });

    it('method parseInterger is type number', () => {
        expect(typeof parseInteger).toBe('number');
    });

    it('method parseInteger returns 1', () => {
        expect(parseInteger).toEqual(1);
    });

    it('method parseInterger returns null when an index isn\'t set', () => {
        expect(parseIntegerNull).toEqual(undefined);
    });

    it('method parseInteger throws an error when the index isn\'t type number', () => {
        expect(() => {
            badStepIndexTagTokenizer().getToken();
            UtilDocElementParser.parseInteger(badStepIndexTagApiDocumentation(), badStepIndexTagTokenizer());
        }).toThrow(new Error('Cannot parse \'[]\' of type \'object\'. It must be of type \'number\''));
    });

    it('has method parse', () => {
        expect(parse).toBeDefined();
    });

    it ('method parse is type object', () => {
        expect(typeof parse).toBe('object');
    });

    it('method parse returns an array of object MarkupBasicElement', () => {
        expect(parse).toEqual([]);
    });

    it('method parse returns an empty array when a block tag is parsed', () => {
        expect(parseBlockTag).toEqual([]);
    });

    it('method parse returns an array of object MarkupBasicElement when a text tag is parsed', () => {
        expect(parseTextTag).toEqual([{kind: 'text', text: ' This is a test message.'}]);
    });

    it('method parse adds a token to the incompleteInheritdocs array in ' +
    'its ApiDocumentation instance when the inline "@inheritdoc" tag is parsed', () => {
        const token: Token = new Token(TokenType.InlineTag, '@inheritdoc', 'UTIL_GetExtractorContext()');
        expect(inheritdocInlineTagApiDocumentation.incompleteInheritdocs).toEqual([
            token
        ]);
    });

    it('method parse assigns true to the isDocInherited variable in it\'s ' +
    'ApiDocumentation instance when the inline "@inheritdoc" tag is parsed', () => {
        expect(inheritdocInlineTagApiDocumentation.isDocInherited).toEqual(true);
    });

    it('method parse returns an array of object MarkupBasicElement when a inline "@link" tag is parsed', () => {
        expect(parseLinkInlineTag).toEqual([
            {
                kind: 'text',
                text: ' Checkout this '
            },
            {
                kind: 'web-link',
                elements: [
                    {
                        kind: 'text',
                        text: 'Microsoft'
                    }
                ],
                targetUrl: 'https://microsoft.com'
            },
            {
                kind: 'text',
                text: ' Checkout this external package '
            },
            {
                kind: 'api-link',
                elements: [
                    {
                        kind: 'text',
                        text: 'Ossiaco'
                    }
                ],
                target: {
                    exportName: 'UTIL_GetExtractorContext',
                    memberName: '',
                    packageName: 'tutorial-extractor-tests',
                    scopeName: '@ossiaco'
                }
            }
        ]);
    });

    it ('method parse adds a link markup element to the incompleteLinks array in it\'s ' +
    'ApiDocumentation instance when the element kind is \'api-link\'', () => {
        const apiLink: IMarkupApiLink = {
            kind: 'api-link',
            elements: [
                {
                    kind: 'text',
                    text: 'Ossiaco'
                }
            ],
            target: {
                exportName: 'UTIL_GetExtractorContext',
                memberName: '',
                packageName: 'tutorial-extractor-tests',
                scopeName: '@ossiaco'
            }
        };
        expect(linkInlineTagApiDocumentation.incompleteLinks).toEqual([
            apiLink,
            apiLink
        ]);
    });

    it('has method parseAndNormalize', () => {
        expect(parseAndNormalize).toBeDefined();
    });

    it('method parseAndNormalize is type object', () => {
        expect(typeof parseAndNormalize).toBe('object');
    });

    it('method parseAndNormalize returns an empty array', () => {
        expect(parseAndNormalize).toEqual([]);
    });

    it('has method parseCode', () => {
        expect(parseCode).toBeDefined();
    });

    it('method parseCode is type object', () => {
        expect(typeof parseCode).toBe('object');
    });

    it('method parseCode returns a IMarkupCodeBox object', () => {
        expect(parseCode).toEqual([
            {
                kind: 'code-box',
                text: `
           import * as fs from \'fs\';
        `,
                highlighter: 'javascript'
            }
        ]);
    });

    it('has method parseLinkTag', () => {
        expect(parseWebLinkTag).toBeDefined();
    });

    it('method parseLinkTag is type object', () => {
        expect(typeof parseWebLinkTag).toBe('object');
    });

    it('method parseLinkTag returns a MarkupBasicElement of kind \'web-link\' when parsing a web link', () => {
        expect(parseWebLinkTag).toEqual({
            kind: 'web-link',
            elements: [
                {
                    kind: 'text',
                    text: 'Microsoft'
                }
            ],
            targetUrl: 'https://microsoft.com'
        });
    });

    it('method parseLinkTag returns a MarkupBasicElement of kind \'api-link\' when parsing a api link', () => {
        expect(parseApiLinkTag).toEqual({
            kind: 'api-link',
            elements: [
                {
                    kind: 'text',
                    text: 'Ossiaco'
                }
            ],
            target: {
                exportName: 'UTIL_GetExtractorContext',
                memberName: '',
                packageName: 'tutorial-extractor-tests',
                scopeName: '@ossiaco'
            }
        });
    });

    it('has method parseSteps', () => {
        expect(parseSteps).toBeDefined();
    });

    it('method parseSteps is type object', () => {
        expect(typeof parseSteps).toBe('object');
    });

    it('method parseSteps returns the steps from the source file', () => {
        expect(parseSteps).toEqual([
`/**
             * @stepstart
             * @stepindex 1
            */
           import * as Test from './test';
           /**
            * @stepend
           */`
        ]);
    });

    it('method parseSteps throws an error when a \'@stepstart\' ' +
    'tag doesn\'t associated with a \'@stepend\' tag', () => {
        expect(() => {
            parseStepsWithoutStart();
        }).toThrow(new Error('The {@stepend} tag must associate to a {@stepstart} tag'));
    });

    it('method parseSteps throws an error when a \'@stepend\' tag doesn\'t associate with a \'@stepstart\' tag', () => {
        expect(() => {
            parseStepsWithoutEnd();
        }).toThrow(new Error('The {@stepstart} tag must associate to a {@stepend} tag'));
    });
});