/**
 * @public
 */

import {Tokenizer} from '../../../tutorial-extractor/src/index';
import {UTIL_GetSourceFile} from './util_source_file';

const reportError: (message: string) => void = (message: string) => {
    throw new Error(message);
};
const instance: Tokenizer = new Tokenizer(UTIL_GetSourceFile(), reportError);

// tslint:disable-next-line:export-name
export function UTIL_GetTokenizer(): Tokenizer {
    return instance;
}