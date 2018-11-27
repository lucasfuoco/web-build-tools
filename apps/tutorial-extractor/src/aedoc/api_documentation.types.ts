import { AstPackage } from '../ast/ast_package';
import { ResolvedApiItem } from '../resolved_api_item';
import { UtilApiDefinitionReference } from '../utils/util_api_definition_reference';

export interface IReferenceResolver {
    resolver (
        apiDefinitionRef: UtilApiDefinitionReference,
        astPackage: AstPackage,
        warnings: string[]
    ): ResolvedApiItem | undefined;
}