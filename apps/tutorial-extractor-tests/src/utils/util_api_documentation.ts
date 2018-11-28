/**
 * @public
 */

import {
    ApiDocumentation,
    ExtractorContext
} from '@ossiaco/tutorial-extractor';
import {UTIL_GetExtractorContext} from './util_extractor_context';
import {UTIL_GetSourceFile} from './util_source_file';

const context: ExtractorContext = UTIL_GetExtractorContext();
const reportError: (message: string) => void = (message: string) => {
    throw new Error(message);
};
const instance: ApiDocumentation = new ApiDocumentation(
    UTIL_GetSourceFile(),
    context.docItemLoader,
    context,
    reportError,
    []
);

// tslint:disable-next-line:export-name
export function UTIL_GetApiDocumentation(): ApiDocumentation {
    return instance;
}