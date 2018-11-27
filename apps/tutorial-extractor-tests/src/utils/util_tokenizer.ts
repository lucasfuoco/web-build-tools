/**
 * @public
 */

import {Tokenizer} from '../../../tutorial-extractor/src/aedoc/tokenizer';
import {UTIL_GetSourceFile} from '../utils/util_source_file';

const reportError = (message: string) => {throw new Error(message);};
const instance: Tokenizer = new Tokenizer(UTIL_GetSourceFile(), reportError);

export function UTIL_GetTokenizer(): Tokenizer {
    return instance;
}