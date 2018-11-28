import {DocItemLoader} from '@ossiaco/tutorial-extractor';

describe('Class DocItemLoader', () => {
    let instance: DocItemLoader;
    beforeAll(() => {
        instance = new DocItemLoader();
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of DocItemLoader', () => {
        expect(instance instanceof DocItemLoader).toBeTruthy();
    });
});