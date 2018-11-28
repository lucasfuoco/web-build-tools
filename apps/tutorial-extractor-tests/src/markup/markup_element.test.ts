import {
    IMarkupApiLink,
    IMarkupCodeBox,
    IMarkupLineBreak,
    IMarkupParagraph,
    IMarkupText,
    IMarkupWebLink
} from '@ossiaco/tutorial-extractor';

describe('Interface IMarkupText', () => {
    let markupText: IMarkupText;
    beforeAll(() => {
        markupText = {
            kind: 'text',
            text: '',
            bold: true,
            italics: true
        };
    });

    it('is defined', () => {
        expect(markupText).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(markupText)).toEqual([
            'kind',
            'text',
            'bold',
            'italics'
        ]);
    });

    it('key kind is type string', () => {
        expect(typeof markupText.kind).toBe('string');
    });

    it('key text is type string', () => {
        expect(typeof markupText.text).toBe('string');
    });

    it('key bold is type boolean', () => {
        expect(typeof markupText.bold).toBe('boolean');
    });

    it('key italics is type boolean', () => {
        expect(typeof markupText.italics).toBe('boolean');
    });
});

describe('Interface IMarkupApiLink', () => {
    let markupApiLink: IMarkupApiLink;
    beforeAll(() => {
        markupApiLink = {
            kind: 'api-link',
            elements: [],
            target: {
                scopeName: '',
                packageName: '',
                exportName: '',
                memberName: ''
            }
        };
    });

    it('is defined', () => {
        expect(markupApiLink).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(markupApiLink)).toEqual([
            'kind',
            'elements',
            'target'
        ]);
    });

    it('key kind is type string', () => {
        expect(typeof markupApiLink.kind).toBe('string');
    });

    it('key elements is type object', () => {
        expect(typeof markupApiLink.elements).toBe('object');
    });

    it('key target is type object', () => {
        expect(typeof markupApiLink.target).toBe('object');
    });
});

describe('Interface IMarkupWebLink', () => {
    let markupWebLink: IMarkupWebLink;
    beforeAll(() => {
        markupWebLink = {
            kind: 'web-link',
            elements: [],
            targetUrl: ''
        };
    });

    it('is defined', () => {
        expect(markupWebLink).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(markupWebLink)).toEqual([
            'kind',
            'elements',
            'targetUrl'
        ]);
    });

    it('key kind is type string', () => {
        expect(typeof markupWebLink.kind).toBe('string');
    });

    it('key elements is type object', () => {
        expect(typeof markupWebLink.elements).toBe('object');
    });

    it('key targetUrl is type string', () => {
        expect(typeof markupWebLink.targetUrl).toBe('string');
    });
});

describe('Interface IMarkupParagraph', () => {
    let markupParagraph: IMarkupParagraph;
    beforeAll(() => {
        markupParagraph = {
            kind: 'paragraph'
        };
    });

    it('is defined', () => {
        expect(markupParagraph).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(markupParagraph)).toEqual([
            'kind'
        ]);
    });

    it('key kind is type string', () => {
        expect(typeof markupParagraph.kind).toBe('string');
    });
});

describe('Interface IMarkupLineBreak', () => {
    let markupLineBreak: IMarkupLineBreak;
    beforeAll(() => {
        markupLineBreak = {
            kind: 'break'
        };
    });

    it('is defined', () => {
        expect(markupLineBreak).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(markupLineBreak)).toEqual([
            'kind'
        ]);
    });

    it('key kind is type string', () => {
        expect(typeof markupLineBreak.kind).toBe('string');
    });
});

describe('Interface IMarkupCodeBox', () => {
    let markupCodeBox: IMarkupCodeBox;
    beforeAll(() => {
        markupCodeBox = {
            kind: 'code-box',
            text: '',
            highlighter: 'javascript'
        };
    });

    it('is defined', () => {
        expect(markupCodeBox).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(markupCodeBox)).toEqual([
            'kind',
            'text',
            'highlighter'
        ]);
    });

    it('key kind is type string', () => {
        expect(typeof markupCodeBox.kind).toBe('string');
    });

    it('key text is type string', () => {
        expect(typeof markupCodeBox.text).toBe('string');
    });

    it('key highlighter is type string', () => {
        expect(typeof markupCodeBox.highlighter).toBe('string');
    });
});