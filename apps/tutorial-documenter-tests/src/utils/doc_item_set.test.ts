import { DocItemSet } from '../../../tutorial-documenter/src/utils/doc_item_set';

describe('Class DocItemSet', () => {
    let instance: DocItemSet;
    beforeAll(() => {
        instance = new DocItemSet();
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });
});