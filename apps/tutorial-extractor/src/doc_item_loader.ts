import { IReferenceResolver } from './aedoc/api_documentation.types';
import {AstItem} from './ast/ast_item';
import { AstItemContainer } from './ast/ast_item_container';
import { AstPackage } from './ast/ast_package';
import { ResolvedApiItem } from './resolved_api_item';
import { UtilApiDefinitionReference } from './utils/util_api_definition_reference';

export class DocItemLoader implements IReferenceResolver {
    constructor() {}
    resolver (
        apiDefinitionRef: UtilApiDefinitionReference,
        astPackage: AstPackage,
        warnings: string[]
    ): ResolvedApiItem | undefined {
        // We determine if an 'apiDefinitionRef' is local if it has no package name or if the scoped
        // package name is equal to the current package's scoped package name.
        if (!apiDefinitionRef.packageName || apiDefinitionRef.toScopePackageString() === astPackage.name) {
            // Resolution for local references
            return this.resolveLocalReferences(apiDefinitionRef, astPackage, warnings);
        }
        return undefined;
    }

    /**
     * Resolution of API definition references in the scenario that the reference given indicates
     * that we should search within the current AstPackage to resolve.
     * No processing on the AstItem should be done here, this class is only concerned
     * with communicating state.
     */
    resolveLocalReferences(
        apiDefinitionRef: UtilApiDefinitionReference,
        astPackage: AstPackage,
        warnings: string[]
    ): ResolvedApiItem | undefined {
        let astItem: AstItem | undefined = astPackage.getMemberItem(apiDefinitionRef.exportName);
        // Check if export name was not found
        if (!astItem) {
            warnings.push(`Unable to find referenced export \"${apiDefinitionRef.toExportString()}\"`);
            return undefined;
        }

        // If memberName exists then check for the existence of the name
        if (apiDefinitionRef.memberName) {
            if (astItem instanceof AstItemContainer) {
                const astItemContainer: AstItemContainer = (astItem as AstItemContainer);
                // get() returns undefined if there is no match
                astItem = astItemContainer.getMemberItem(apiDefinitionRef.memberName);
            } else {
                // There are no other instances of astItem that has members,
                // thus there must be a mistake with the apiDefinitionRef.
                astItem = undefined;
            }
        }

        if (!astItem) {
            // If we are here, we can be sure there was a problem with the memberName.
            // memberName was not found, apiDefinitionRef is invalid
            warnings.push(`Unable to find referenced member \"${apiDefinitionRef.toMemberString()}\"`);
            return undefined;
        }

        return ResolvedApiItem.createFromAstItem(astItem);
    }
}