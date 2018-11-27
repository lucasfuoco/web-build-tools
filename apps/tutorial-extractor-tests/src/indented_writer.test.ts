import {IndentedWriter} from '../../tutorial-extractor/src/index';

describe('Class IndentedWriter', () => {
    let instance: IndentedWriter;
    let toString: string;
    let increaseIndent: void;
    let decreaseIndent: void;
    let clear: void;
    let write: void;
    let writeLine: void;
    beforeAll(() => {
        instance = new IndentedWriter();
        toString = instance.toString();
        increaseIndent = instance.increaseIndent();
        decreaseIndent = instance.decreaseIndent();
        clear = instance.clear();
        write = instance.write('');
        writeLine = instance.writeLine();
    });

    it('is defined', () => {
        expect(instance).toBeDefined();
    });

    it('is an instance of IdentedWriter', () => {
        expect(instance instanceof IndentedWriter).toBeTruthy();
    });

    it('has variable spacing', () => {
        expect(instance.spacing).toBeDefined();
    });

    it('variable spacing is type string', () => {
        expect(typeof instance.spacing).toBe('string');
    });

    it('variable spacing returns a space', () => {
        expect(instance.spacing).toBe('  ');
    });

    it('has method toString', () => {
        expect(toString).toBeDefined();
    });

    it('method toString is type string', () => {
        expect(typeof toString).toBe('string');
    });

    it('method toString returns an empty string by default', () => {
        expect(toString).toBe('');
    });

    it('has method increaseIndent', () => {
        expect(increaseIndent).toBeUndefined();
    });

    it('has method decreaseIndent', () => {
        expect(decreaseIndent).toBeUndefined();
    });

    it('has method clear', () => {
        expect(clear).toBeUndefined();
    });
    it('has method write', () => {
        expect(write).toBeUndefined();
    });
    it('has method writeLine', () => {
        expect(writeLine).toBeUndefined();
    });
});