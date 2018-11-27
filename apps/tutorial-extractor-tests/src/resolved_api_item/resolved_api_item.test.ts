import { ApiDocumentation } from '../../../tutorial-extractor/src/aedoc/api_documentation';
import {AstItem} from '../../../tutorial-extractor/src/ast/ast_item';
import {ExtractorContext} from '../../../tutorial-extractor/src/extractor_context/extractor_context';
import {ResolvedApiItem} from '../../../tutorial-extractor/src/resolved_api_item';
import {UtilApiDefinitionReference}  from '../../../tutorial-extractor/src/utils/util_api_definition_reference';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';

describe('Class ResolvedApiItem', () => {
    let createFromAstItem: ResolvedApiItem;
    beforeAll(() => {
        const reportError = (message: string) => new Error(message);
        const context: ExtractorContext = UTIL_GetExtractorContext();
        const docs = `
            /**
             * @tutorial
             * @public
             * @tutorialname Test
            */
        `;
        const documentation: ApiDocumentation = new ApiDocumentation(
            docs,
            context.docItemLoader,
            context,
            reportError,
            []
        );
        const text = '@ossiaco/tutorial-extractor-tests:UTIL_GetExtractorContext';
        const apiDefinitionRef: UtilApiDefinitionReference | undefined = UtilApiDefinitionReference.createFromString(
            text,
            documentation.reportError
        );
        // if API reference expression is formatted incorrectly then apiDefinitionRef will be undefined
        if (!apiDefinitionRef) {
            documentation.reportError(`Incorrectly formatted API item reference: "${text}"`);
            return;
        }
        const astItem: AstItem | undefined = documentation.context.package.getMemberItem(apiDefinitionRef.exportName);
        if (!astItem) {
            throw new Error(`Unable to find referenced export \"${apiDefinitionRef.toExportString()}\"`);
        }
        createFromAstItem = ResolvedApiItem.createFromAstItem(astItem);
    });
    it('has method createFromAstItem', () => {
        expect(createFromAstItem).toBeDefined();
    });
});