import {
    ApiDocumentation,
    AstItem,
    ExtractorContext,
    ResolvedApiItem,
    UtilApiDefinitionReference
} from '@ossiaco/tutorial-extractor';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';

describe('Class ResolvedApiItem', () => {
    let createFromAstItem: ResolvedApiItem;
    beforeAll(() => {
        const reportError: (message: string) => void = (message: string) => new Error(message);
        const context: ExtractorContext = UTIL_GetExtractorContext();
        const docs: string = `
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
        const text: string = '@ossiaco/tutorial-extractor-tests:UTIL_GetExtractorContext';
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