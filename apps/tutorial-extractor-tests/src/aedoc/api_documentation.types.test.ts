import {UTIL_GetExtractorContext} from '../utils/util_extractor_context';
import {
    AstPackage,
    IReferenceResolver,
    ResolvedApiItem,
    ExtractorContext,
    ApiDocumentation,
    UtilApiDefinitionReference
} from '../../../tutorial-extractor/src/index';

describe('Interface IReferenceResolver', () => {
    let referenceResolver: IReferenceResolver;
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
        referenceResolver = {
            resolver(
                definitionRef: UtilApiDefinitionReference,
                astPackage: AstPackage,
                warnings: string[]
            ): ResolvedApiItem | undefined {
                if (!definitionRef.packageName || definitionRef.toScopePackageString() === astPackage.name) {
                    return context.docItemLoader.resolveLocalReferences(definitionRef, astPackage, warnings);
                }
                return undefined;
            }
        };
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