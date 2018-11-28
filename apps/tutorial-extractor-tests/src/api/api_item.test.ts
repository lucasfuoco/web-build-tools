import { IApiItemReference } from '@ossiaco/tutorial-extractor';

describe('Interface IApiItemReference', () => {
    let apiItemReference: IApiItemReference;
    beforeAll(() => {
        apiItemReference = {
            scopeName: '',
            packageName: '',
            exportName: '',
            memberName: ''
        };
    });

    it('is defined', () => {
        expect(apiItemReference).toBeDefined();
    });

    it('has the right keys', () => {
        expect(Object.keys(apiItemReference)).toEqual([
            'scopeName',
            'packageName',
            'exportName',
            'memberName'
        ]);
    });

    it('key scopeName is type string', () => {
        expect(typeof apiItemReference.scopeName).toBe('string');
    });

    it('key packageName is type string', () => {
        expect(typeof apiItemReference.packageName).toBe('string');
    });

    it('key exportName is type string', () => {
        expect(typeof apiItemReference.exportName).toBe('string');
    });

    it('key memberName is type string', () => {
        expect(typeof apiItemReference.memberName).toBe('string');
    });
});