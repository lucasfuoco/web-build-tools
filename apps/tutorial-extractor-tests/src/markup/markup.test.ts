import {Markup} from '../../../tutorial-extractor/src/markup/markup';
import {
    IMarkupApiLink,
    IMarkupCodeBox,
    IMarkupText,
    IMarkupWebLink,
    MarkupBasicElement
} from '../../../tutorial-extractor/src/markup/markup_element';

describe('Class Markup', () => {
    let createTextElements: IMarkupText[];
    let createTextElementsWithOptions: IMarkupText[];
    let createTextElementsWithoutText: IMarkupText[];
    let createTextParagraphs: MarkupBasicElement[];
    let createTextParagraphsWithOptions: MarkupBasicElement[];
    let createTextParagraphsWithoutText: MarkupBasicElement[];
    let createWebLink: IMarkupWebLink;
    let createWebLinkWithoutText: () => IMarkupWebLink;
    let createWebLinkWithoutLink: () => IMarkupWebLink;
    let createApiLink: IMarkupApiLink;
    let createApiLinkWithoutText: () => IMarkupApiLink;
    let createApiLinkWithoutPackageName: () => IMarkupApiLink;
    let createCodeBox: IMarkupCodeBox;
    let createCodeBoxWithoutText: () => IMarkupCodeBox;
    beforeAll(() => {
        createTextElements = Markup.createTextElements('This is a test message');
        createTextElementsWithOptions = Markup.createTextElements('This is a test message', {bold: true, italics: true});
        createTextElementsWithoutText = Markup.createTextElements('');
        createTextParagraphs = Markup.createTextParagraphs('This is a test message\n\nThis is a test message');
        createTextParagraphsWithOptions = Markup.createTextParagraphs('This is a test message\n\nThis is a test message', {bold: true, italics: true});
        createTextParagraphsWithoutText = Markup.createTextParagraphs('');
        createWebLink = Markup.createWebLink([{kind: 'text', text: 'Microsoft'}], 'https://microsoft.com');
        createWebLinkWithoutText = () => Markup.createWebLink([], 'https://microsoft.com');
        createWebLinkWithoutLink = () => Markup.createWebLink([{kind: 'text', text: 'Microsoft'}], '');
        createApiLink = Markup.createApiLink([{kind: 'text', text: 'Ossiaco'}], {scopeName: '', packageName: '@ossiaco', exportName: 'Markup', memberName: 'createApiLink'});
        createApiLinkWithoutText = () => Markup.createApiLink([], {scopeName: '', packageName: '@ossiaco', exportName: 'Markup', memberName: 'createApiLink'});
        createApiLinkWithoutPackageName = () => Markup.createApiLink([{kind: 'text', text: 'Ossiaco'}], {scopeName: '', packageName: '', exportName: '', memberName: ''});
        createCodeBox = Markup.createCodeBox('import * as fs from \'fs\';', 'javascript');
        createCodeBoxWithoutText = () => Markup.createCodeBox('', 'javascript');
    });

    it('has object PARAGRAPH', () => {
        expect(Markup.PARAGRAPH).toBeDefined();
    });

    it('object PARAGRAPH is type object', () => {
        expect(typeof Markup.PARAGRAPH).toBe('object');
    });

    it('object PARAGRAPH returns an IMarkupParagraph object', () => {
        expect(Markup.PARAGRAPH).toEqual({
            kind: 'paragraph'
        });
    });

    it('has method createTextElements', () => {
        expect(createTextElements).toBeDefined();
    });

    it('method createTextElements is type object', () => {
        expect(typeof createTextElements).toBe('object');
    });

    it('method createTextElements returns an array of object IMarkupText without options set', () => {
        expect(createTextElements).toEqual([
            {
                kind: 'text',
                text: 'This is a test message'
            }
        ]);
    });

    it('method createTextElements returns an array of object IMarkupText with options set', () => {
        expect(createTextElementsWithOptions).toEqual([
            {
                kind: 'text',
                text: 'This is a test message',
                bold: true,
                italics: true
            }
        ]);
    });

    it('method createTextElements returns an empty array when no text is set', () => {
        expect(createTextElementsWithoutText).toEqual([]);
    });

    it('has method createTextParagraphs', () => {
        expect(createTextParagraphs).toBeDefined();
    });

    it('method createTextParagraphs is type object', () => {
        expect(typeof createTextParagraphs).toBe('object');
    });

    it('method createTextParagraphs returns an array of object MarkupBasicElement without options set', () => {
        expect(createTextParagraphs).toEqual([
            {
                kind: 'text',
                text: 'This is a test message'
            },
            {
                kind: 'paragraph'
            },
            {
                kind: 'text',
                text: 'This is a test message'
            }
        ]);
    });

    it('method createTextParagraphs returns an array of object MarkupBasicElement with options set', () => {
        expect(createTextParagraphsWithOptions).toEqual([
            {
                kind: 'text',
                text: 'This is a test message',
                bold: true,
                italics: true
            },
            {
                kind: 'paragraph'
            },
            {
                kind: 'text',
                text: 'This is a test message',
                bold: true,
                italics: true
            }
        ]);
    });

    it('method createTextParagraphs returns an empty array when no text is set', () => {
        expect(createTextParagraphsWithoutText).toEqual([]);
    });

    it('has method createWebLink', () => {
        expect(createWebLink).toBeDefined();
    });

    it('method createWebLink is type object', () => {
        expect(typeof createWebLink).toBe('object');
    });

    it('method createWebLink return an IMarkupWebLink object', () => {
        expect(createWebLink).toEqual({
            kind: 'web-link',
            elements: [{kind: 'text', text: 'Microsoft'}],
            targetUrl: 'https://microsoft.com'
        });
    });

    it('method createWebLink throws an error when no text elements are set', () => {
        expect(() => {createWebLinkWithoutText();}).toThrow(new Error('Missing text for link'));
    });

    it('method createWebLink throws an error when no link is set', () => {
        expect(() => {createWebLinkWithoutLink();}).toThrow(new Error('Missing link target'));
    });

    it('has method createApiLink', () => {
        expect(createApiLink).toBeDefined();
    });

    it('method createApiLink is type object', () => {
        expect(typeof createApiLink).toEqual('object');
    });

    it('method createApiLink returns an IMarkupApiLink object', () => {
        expect(createApiLink).toEqual({
            kind: 'api-link',
            elements: [{kind: 'text', text: 'Ossiaco'}],
            target: {
                scopeName: '',
                packageName: '@ossiaco',
                exportName: 'Markup',
                memberName: 'createApiLink'
            }
        })
    });

    it('method createApiLink returns an error when no text is set', () => {
        expect(() => {createApiLinkWithoutText();}).toThrow(new Error('Missing text for link'));
    });

    it('method createApiLink returns an error when no packageName is set', () => {
        expect(() => {createApiLinkWithoutPackageName();}).toThrow(new Error('The IApiItemReference.packageName cannot be empty'));
    });

    it('has method createCodeBox', () => {
        expect(createCodeBox).toBeDefined();
    });

    it('method createCodeBox is type object', () => {
        expect(typeof createCodeBox).toBe('object');
    });

    it('method createCodeBox returns an IMarkupCodeBox object', () => {
        expect(createCodeBox).toEqual({
            kind: 'code-box',
            text: 'import * as fs from \'fs\';',
            highlighter: 'javascript'
        });
    });

    it('method createCodeBox throws error when there is empty text', () => {
        expect(() => {
            createCodeBoxWithoutText();
        }).toThrow(new Error('The code parameter is empty'));
    });
});