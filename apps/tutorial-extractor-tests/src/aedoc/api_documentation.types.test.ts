import {ApiDocumentation} from '../../../tutorial-extractor/src/aedoc/api_documentation';
import {ExtractorContext} from '../../../tutorial-extractor/src/extractor_context/extractor_context';
import {
    AstPackage,
    IReferenceResolver,
    ResolvedApiItem
} from '../../../tutorial-extractor/src/index';
import {UtilApiDefinitionReference} from '../../../tutorial-extractor/src/utils/util_api_definition_reference';
import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';

describe('Interface IReferenceResolver', () => {
    let referenceResolver: IReferenceResolver;
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
        referenceResolver = {
            resolver(
                apiDefinitionRef: UtilApiDefinitionReference,
                astPackage: AstPackage,
                warnings: string[]
            ): ResolvedApiItem | undefined {
                if(!apiDefinitionRef.packageName || apiDefinitionRef.toScopePackageString() === astPackage.name) {
                    return context.docItemLoader.resolveLocalReferences(apiDefinitionRef, astPackage, warnings);
                }
                return undefined;
            }
        }
    });

    it('is defined', () => {
        expect(referenceResolver).toBeDefined();
    });

    it('contains the right keys', () => {
        expect(Object.keys(referenceResolver)).toEqual([
            'resolver'
        ]);
    });
});