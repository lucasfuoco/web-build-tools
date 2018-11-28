import { DocItemSet } from '@ossiaco/tutorial-documenter';

describe('Class DocItemSet', () => {
    let instance: DocItemSet;
    beforeAll(() => {
        instance = new DocItemSet();
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });
});