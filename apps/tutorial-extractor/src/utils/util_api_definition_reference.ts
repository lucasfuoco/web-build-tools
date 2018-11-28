import { IApiItemReference } from '../api/index';

/**
 * An API definition reference that is used to locate the documentation of exported
 * API items that may or may not belong to an external packages.
 */
export interface IApiDefinitionReferenceParts {
    /**
     * This is an optional property to denote that a package name is scoped under this name.
     * For example, a common case is when having the '@microsoft' scope name in the
     * API definition reference: '\@microsoft/sp-core-library'.
     */
    scopeName: string;
    /**
     * The name of the package that the exportName belongs to.
     */
    packageName: string;
    /**
     * The name of the export API item.
     */
    exportName: string;
    /**
     * The name of the member API item.
     */
    memberName: string;
}

/**
 * A scope and package name are semantic information within an API reference expression.
 * If there is no scope or package, then the corresponding values will be an empty string.
 */
export interface IScopedPackageName {
    /**
   * The scope name of an API reference expression.
   */
  scope: string;

  /**
   * The package name of an API reference expression.
   */
  package: string;
}

export class UtilApiDefinitionReference {
    /**
     * Splits an API reference expression into two parts, first part is the scopename/packageName and
     * the second part is the exportName.memberName.
     */
    private static _packageRegEx: RegExp = /^([^:]*)\:(.*)$/;
    /**
     * Splits the exportName.memberName into two respective parts.
     */
    private static _memberRegEx: RegExp = /^([^.|:]*)(?:\.(\w+))?$/;
    /**
     * Used to ensure that the export name contains only text characters.
     */
    private static _exportRegEx: RegExp =  /^\w+/;
    public scopeName: string;
    public packageName: string;
    public exportName: string;
    public memberName: string;
    /**
     * Creates an ApiDefinitionReference instance given strings that symbolize the public
     * properties of ApiDefinitionReference.
     */
    public static createFromParts(parts: IApiDefinitionReferenceParts): UtilApiDefinitionReference {
        return new UtilApiDefinitionReference(parts);
    }
    /**
     * Takes an API reference expression of the form '@scopeName/packageName.memberName'
     * and deconstructs it into an IApiDefinitionReference interface object.
     */
    public static createFromString(
        apiReferenceExpr: string,
        reportError: (message: string) => void
    ): UtilApiDefinitionReference | undefined {
        if (!apiReferenceExpr || apiReferenceExpr.split(' ').length > 1) {
            reportError(`An API item reference must use the notation: ` +
            `"@scopeName/packageName:exportName.memberName".\nReceived: "${apiReferenceExpr}"`);
            return undefined;
        }

        const apiDefRefParts: IApiDefinitionReferenceParts = {
            scopeName: '',
            packageName: '',
            exportName: '',
            memberName: ''
        };

        let parts: string[] | null = apiReferenceExpr.match(UtilApiDefinitionReference._packageRegEx);
        if (parts) {
            // parts[1] is of the form ‘@microsoft/sp-core-library’ or ‘sp-core-library’
            const scopePackageName: IScopedPackageName = UtilApiDefinitionReference.parseScopedPackageName(parts[1]);
            apiDefRefParts.scopeName = scopePackageName.scope;
            apiDefRefParts.packageName = scopePackageName.package;
            apiReferenceExpr = parts[2];
        }

        parts = apiReferenceExpr.match(UtilApiDefinitionReference._memberRegEx);
        if (parts) {
            apiDefRefParts.exportName = parts[1];
            apiDefRefParts.memberName = parts[2] ? parts[2] : '';
        } else {
            // The export name is required
            reportError(`The API item reference contains an invalid ` +
            `"exportName.memberName" expression: "${apiReferenceExpr}"`);
            return undefined;
        }
        if (!apiReferenceExpr.match(UtilApiDefinitionReference._exportRegEx)) {
            reportError(`The API item reference contains invalid characters: "${apiReferenceExpr}"`);
            return undefined;
        }

        return UtilApiDefinitionReference.createFromParts(apiDefRefParts);
    }
    /** For a scoped NPM package name this separates the scope and package parts. */
    public static parseScopedPackageName(scopedName: string): IScopedPackageName {
        if (scopedName.substr(0, 1) !== '@') {
            return {scope: '', package: scopedName};
        }

        const slashIndex: number = scopedName.indexOf('/');
        if (slashIndex >= 0) {
            return {scope: scopedName.substr(0, slashIndex), package: scopedName.substr(slashIndex + 1)};
        } else {
            throw new Error('Invalid scoped name: ' + scopedName);
        }
    }

    public toApiItemReference(): IApiItemReference {
        return {
            scopeName: this.scopeName,
            packageName: this.packageName,
            exportName: this.exportName,
            memberName: this.memberName
        };
    }
    /**
     * Stringifies the ApiDefinitionReferenceOptions up and including the
     * scoped and package name.
     *
     * Example output: '@microsoft/Utilities'
     */
    public toScopePackageString(): string {
        let result: string = '';
        if (this.scopeName) {
            result += `${this.scopeName}/${this.packageName}`;
        } else if (this.packageName) {
            result += this.packageName;
        }
        return result;
    }
    /**
     * Stringifies the ApiDefinitionReferenceOptions up and including the
     * scope, package and export name.
     *
     * Example output: '@microsoft/Utilities.Parse'
     */
    public toExportString(): string {
        let result: string = this.toScopePackageString();
        if (result) {
            result += ':';
        }
        return result + `${this.exportName}`;
    }
    /**
     * Stringifies the ApiDefinitionReferenceOptions up and including the
     * scope, package, export and member name.
     *
     * Example output: '@microsoft/Utilities.Parse.parseJsonToString'
     */
    public toMemberString(): string {
        return this.toExportString() + `.${this.memberName}`;
    }

    private constructor(parts: IApiDefinitionReferenceParts) {
        this.scopeName = parts.scopeName;
        this.packageName = parts.packageName;
        this.exportName = parts.exportName;
        this.memberName = parts.memberName;
    }
}