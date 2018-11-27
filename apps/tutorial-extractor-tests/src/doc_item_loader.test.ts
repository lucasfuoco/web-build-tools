import {DocItemLoader} from '../../tutorial-extractor/src/doc_item_loader';

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