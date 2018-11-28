import {ReleaseTag} from '@ossiaco/tutorial-extractor';

describe('Enum ReleaseTag', () => {
    it('is defined', () => {
        expect(ReleaseTag).toBeDefined();
    });

    it('is type object', () => {
        expect(typeof ReleaseTag).toBe('object');
    });

    it('has the right values', () => {
        expect(ReleaseTag).toEqual({
            0: 'None',
            1: 'Internal',
            2: 'Alpha',
            3: 'Beta',
            4: 'Public',
            'Alpha': 2,
            'Beta': 3,
            'Internal': 1,
            'None': 0,
            'Public': 4
        });
    });
});