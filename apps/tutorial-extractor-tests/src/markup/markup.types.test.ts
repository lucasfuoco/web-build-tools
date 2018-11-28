import {IMarkupCreateTextOptions} from '@ossiaco/tutorial-extractor';

describe('Interface IMarkupCreateTextOptions', () => {
    let markupCreateTextOptions: IMarkupCreateTextOptions;
    beforeAll(() => {
        markupCreateTextOptions = {
            bold: true,
            italics: true
        };
    });

    it('is defined', () => {
        expect(markupCreateTextOptions).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(markupCreateTextOptions)).toEqual([
            'bold',
            'italics'
        ]);
    });

    it('key bold is type boolean', () => {
        expect(typeof markupCreateTextOptions.bold).toBe('boolean');
    });

    it('key italics is type boolean', () => {
        expect(typeof markupCreateTextOptions.italics).toBe('boolean');
    });
});