/**
 * @public
 */

import {ApiDocumentation} from '../../../tutorial-extractor/src/aedoc/api_documentation';
import {ExtractorContext} from '../../../tutorial-extractor/src/extractor_context/extractor_context';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';
import {UTIL_GetSourceFile} from '../utils/util_source_file';

const context: ExtractorContext = UTIL_GetExtractorContext();
const reportError = (message: string) => {throw new Error(message);};
const instance: ApiDocumentation = new ApiDocumentation(
    UTIL_GetSourceFile(),
    context.docItemLoader,
    context,
    reportError,
    []
);

export function UTIL_GetApiDocumentation(): ApiDocumentation {
    return instance;
}