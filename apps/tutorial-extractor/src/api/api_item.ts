import {
    MarkupBasicElement,
    MarkupStructuredElement,
    MarkupElement
} from '../markup/index';

/** Represents a reference to an ApiItem */
export interface IApiItemReference {
    /** The name of the NPM scope, or an empty string if there is no scope */
    scopeName: string;
    /** The name of the NPM package that the API item belongs to, without the NPM scope. */
    packageName: string;
    /** The name of an exported API item, or an empty string.*/
    exportName: string;
    /** The name of a member of the exported item, or an empty string. */
    memberName: string;
}

/**
 * An ordered map of items, indexed by the symbol name.
 * @alpha
 */
export interface IApiNameMap<T> {
    /**
     * For a given name, returns the object with that name.
     */
    [name: string]: T;
}

/** A property of a tutorial step */
export interface IApiStep {
    kind: 'step';
    stepName: MarkupElement[];
    summary: MarkupBasicElement[];
    remarks: MarkupStructuredElement[];
    code: MarkupElement[];
    codeDescription: MarkupBasicElement[];
    /**
     * The following are needed so that this interface and can share
     * common properties with others that extend IApiBaseDefinition. The IApiPackage
     * does not extend the IApiBaseDefinition because a summary is not required for
     * a package.
     */
    isBeta: boolean;
    deprecatedMessage?: MarkupBasicElement[];
}

/**
 * IApiPackage is an object contaning the exported
 * definions of this API package. The exports can include:
 * classes, interfaces, enums, functions.
 * @alpha
 */
export interface IApiPackage {
    /**
    * {@inheritdoc IApiBaseDefinition.kind}
    */
    kind: 'package';

    /**
     * The name of the NPM package, including the optional scope.
     * @remarks
     * Example: "@microsoft/example-package"
     */
    name: string;

    /**
     * IDocItems of exported API items
     */
    exports: IApiNameMap<ApiItem>;

    /**
     * The following are needed so that this interface and can share
     * common properties with others that extend IApiBaseDefinition. The IApiPackage
     * does not extend the IApiBaseDefinition because a summary is not required for
     * a package.
     */
    isBeta: boolean;
    summary: MarkupBasicElement[];
    remarks: MarkupStructuredElement[];
    deprecatedMessage?: MarkupBasicElement[];
}

export interface IApiTutorial {
    kind: 'tutorial';
    tutorialName: MarkupElement[];
    category: MarkupElement[];
    summary: MarkupBasicElement[];
    remarks: MarkupStructuredElement[];
    /**
     * The following are needed so that this interface and can share
     * common properties with others that extend IApiBaseDefinition. The IApiPackage
     * does not extend the IApiBaseDefinition because a summary is not required for
     * a package.
     */
    isBeta: boolean;
    children: ApiMember[];
    deprecatedMessage?: MarkupBasicElement[];
}

export type ApiMember = IApiStep;

export type ApiItem = IApiPackage | IApiTutorial | ApiMember;