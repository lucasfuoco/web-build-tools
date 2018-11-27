import { AstItemKind } from '../ast/ast_item.types';

/**
 * Supports the conversion between AstItems that are loaded from AstItem to JSON notation
 * and vice versa.
 */
export class ApiJsonConverter {
    // tslint:disable:no-inferrable-types
    private static _KIND_PACKAGE: string = 'package';
    private static _KIND_TUTORIAL: string = 'tutorial';
    private static _KIND_STEP: string = 'step';

    /**
     * Uses the lowercase string that represents 'kind' in an API JSON file, and
     * converts it to an AstItemKind enum value.
     */
    static convertKindToJson (astItemKind: AstItemKind): string {
        switch (astItemKind) {
            case (AstItemKind.Package):
                return this._KIND_PACKAGE;
            case (AstItemKind.Tutorial):
                return this._KIND_TUTORIAL;
            case (AstItemKind.Step):
                return this._KIND_STEP;
            default:
                throw new Error('Unsupported API item kind when converting to string used in API JSON file.');
        }
    }
}