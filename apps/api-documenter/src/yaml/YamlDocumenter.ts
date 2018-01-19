// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as fsx from 'fs-extra';
import * as path from 'path';
import yaml = require('js-yaml');
import { JsonFile, JsonSchema } from '@microsoft/node-core-library';
import {
  MarkupElement,
  IApiMethod,
  IApiConstructor,
  IApiParameter,
  IApiProperty,
  IApiEnumMember,
  IApiClass,
  IApiInterface
} from '@microsoft/api-extractor';

import { DocItemSet, DocItem, DocItemKind, IDocItemSetResolveResult } from '../utils/DocItemSet';
import {
  IYamlApiFile,
  IYamlItem,
  IYamlSyntax,
  IYamlParameter
} from './IYamlApiFile';
import {
  IYamlTocFile,
  IYamlTocItem
} from './IYamlTocFile';
import { Utilities } from '../utils/Utilities';
import { MarkdownRenderer, IMarkdownRenderApiLinkArgs } from '../utils/MarkdownRenderer';

const yamlApiSchema: JsonSchema = JsonSchema.fromFile(path.join(__dirname, 'typescript.schema.json'));

/**
 * Writes documentation in the Universal Reference YAML file format, as defined by typescript.schema.json.
 */
export class YamlDocumenter {
  private _docItemSet: DocItemSet;
  private _outputFolder: string;

  public constructor(docItemSet: DocItemSet) {
    this._docItemSet = docItemSet;
  }

  public generateFiles(outputFolder: string): void { // virtual
    this._outputFolder = outputFolder;

    console.log();
    this._deleteOldOutputFiles();

    for (const docPackage of this._docItemSet.docPackages) {
      this._visitDocItems(docPackage, undefined);
    }

    this._writeTocFile(this._docItemSet.docPackages);
  }

  protected onCustomizeYamlItem(yamlItem: IYamlItem): void { // virtual
    // (overridden by child class)
  }

  private _visitDocItems(docItem: DocItem, parentYamlFile: IYamlApiFile | undefined): boolean {
    const yamlItem: IYamlItem | undefined = this._generateYamlItem(docItem);
    if (!yamlItem) {
      return false;
    }

    this.onCustomizeYamlItem(yamlItem);

    if (this._shouldEmbed(docItem.kind)) {
      if (!parentYamlFile) {
        throw new Error('Missing file context'); // program bug
      }
      parentYamlFile.items.push(yamlItem);
    } else {
      const newYamlFile: IYamlApiFile = {
        items: []
      };
      newYamlFile.items.push(yamlItem);

      const flattenedChildren: DocItem[] = this._flattenNamespaces(docItem.children);

      for (const child of flattenedChildren) {
        if (this._visitDocItems(child, newYamlFile)) {
          if (!yamlItem.children) {
            yamlItem.children = [];
          }
          yamlItem.children.push(this._getUid(child));
        }
      }

      const yamlFilePath: string = this._getYamlFilePath(docItem);

      if (docItem.kind === DocItemKind.Package) {
        console.log('Writing ' + this._getYamlFilePath(docItem));
      }

      this._writeYamlFile(newYamlFile, yamlFilePath, 'UniversalReference', yamlApiSchema);

      if (parentYamlFile) {
        if (!parentYamlFile.references) {
          parentYamlFile.references = [];
        }

        parentYamlFile.references.push({
          uid: this._getUid(docItem),
          name: this._getYamlItemName(docItem)
        });

      }
    }

    return true;
  }

  // Since the YAML schema does not yet support nested namespaces, we simply omit them from
  // the tree.  However, _getYamlItemName() will show the namespace.
  private _flattenNamespaces(items: DocItem[]): DocItem[] {
    const flattened: DocItem[] = [];
    for (const item of items) {
      if (item.kind === DocItemKind.Namespace) {
        flattened.push(... this._flattenNamespaces(item.children));
      } else {
        flattened.push(item);
      }
    }
    return flattened;
  }

  /**
   * Write the table of contents
   */
  private _writeTocFile(docItems: DocItem[]): void {
    const tocFile: IYamlTocFile = {
      items: [ ]
    };

    tocFile.items!.push(...this._buildTocItems(docItems));

    const tocFilePath: string = path.join(this._outputFolder, 'toc.yml');
    console.log('Writing ' + tocFilePath);
    this._writeYamlFile(tocFile, tocFilePath, 'TableOfContent', undefined);
  }

  private _buildTocItems(docItems: DocItem[]): IYamlTocItem[] {
    const tocItems: IYamlTocItem[] = [];
    for (const docItem of docItems) {
      let tocItem: IYamlTocItem;

      if (docItem.kind === DocItemKind.Namespace) {
        // Namespaces don't have nodes yet
        tocItem = {
          name: Utilities.getUnscopedPackageName(docItem.name)
        };
      } else {
        if (this._shouldEmbed(docItem.kind)) {
          // Don't generate table of contents items for embedded definitions
          continue;
        }

        tocItem = {
          name: Utilities.getUnscopedPackageName(docItem.name),
          uid: this._getUid(docItem)
        };
      }

      tocItems.push(tocItem);

      const childItems: IYamlTocItem[] = this._buildTocItems(docItem.children);
      if (childItems.length > 0) {
        tocItem.items = childItems;
      }
    }
    return tocItems;
  }

  private _shouldEmbed(docItemKind: DocItemKind): boolean {
    switch (docItemKind) {
      case DocItemKind.Class:
      case DocItemKind.Package:
      case DocItemKind.Interface:
      case DocItemKind.Enum:
      return false;
    }
    return true;
  }

  private _generateYamlItem(docItem: DocItem): IYamlItem | undefined {
    const yamlItem: Partial<IYamlItem> = { };
    yamlItem.uid = this._getUid(docItem);

    const summary: string = this._renderMarkdown(docItem.apiItem.summary, docItem);
    if (summary) {
      yamlItem.summary = summary;
    }

    const remarks: string = this._renderMarkdown(docItem.apiItem.remarks, docItem);
    if (remarks) {
      yamlItem.remarks = remarks;
    }

    if (docItem.apiItem.deprecatedMessage) {
      if (docItem.apiItem.deprecatedMessage.length > 0) {
        const deprecatedMessage: string = this._renderMarkdown(docItem.apiItem.deprecatedMessage, docItem);
        yamlItem.deprecated = { content: deprecatedMessage };
      }
    }

    if (docItem.apiItem.isBeta) {
      yamlItem.isPreview = true;
    }

    yamlItem.name = this._getYamlItemName(docItem);

    yamlItem.fullName = yamlItem.uid;
    yamlItem.langs = [ 'typeScript' ];

    switch (docItem.kind) {
      case DocItemKind.Package:
        yamlItem.type = 'package';
        break;
      case DocItemKind.Enum:
        yamlItem.type = 'enum';
        break;
      case DocItemKind.EnumMember:
        yamlItem.type = 'field';
        const enumMember: IApiEnumMember = docItem.apiItem as IApiEnumMember;
        if (enumMember.value) {
          // NOTE: In TypeScript, enum members can be strings or integers.
          // If it is an integer, then enumMember.value will be a string representation of the integer.
          // If it is a string, then enumMember.value will include the quotation marks.
          // Enum values can also be calculated numbers, however this is not implemented yet.
          yamlItem.numericValue = enumMember.value as any; // tslint:disable-line:no-any
        }
        break;
      case DocItemKind.Class:
        yamlItem.type = 'class';
        this._populateYamlClassOrInterface(yamlItem, docItem);
        break;
      case DocItemKind.Interface:
        yamlItem.type = 'interface';
        this._populateYamlClassOrInterface(yamlItem, docItem);
        break;
      case DocItemKind.Method:
        yamlItem.type = 'method';
        this._populateYamlMethod(yamlItem, docItem);
        break;
      case DocItemKind.Constructor:
        yamlItem.type = 'constructor';
        this._populateYamlMethod(yamlItem, docItem);
        break;
      case DocItemKind.Property:
        yamlItem.type = 'property';
        this._populateYamlProperty(yamlItem, docItem);
        break;
      case DocItemKind.Function:
        yamlItem.type = 'function';
        this._populateYamlMethod(yamlItem, docItem);
        break;
      default:
        throw new Error('Unimplemented item kind: ' + DocItemKind[docItem.kind as DocItemKind]);
    }

    if (docItem.kind !== DocItemKind.Package && !this._shouldEmbed(docItem.kind)) {
      yamlItem.package = this._getUid(docItem.getHierarchy()[0]);
    }

    return yamlItem as IYamlItem;
  }

  private _populateYamlClassOrInterface(yamlItem: Partial<IYamlItem>, docItem: DocItem): void {
    const apiStructure: IApiClass | IApiInterface = docItem.apiItem as IApiClass | IApiInterface;

    if (apiStructure.extends) {
      yamlItem.extends = [ apiStructure.extends ];
    }

    if (apiStructure.implements) {
      yamlItem.implements = [ apiStructure.implements ];
    }
  }

  private _populateYamlMethod(yamlItem: Partial<IYamlItem>, docItem: DocItem): void {
    const apiMethod: IApiMethod | IApiConstructor = docItem.apiItem as IApiMethod;
    yamlItem.name = Utilities.getConciseSignature(docItem.name, apiMethod);

    const syntax: IYamlSyntax = {
      content: apiMethod.signature
    };
    yamlItem.syntax = syntax;

    if (apiMethod.returnValue) {
      const returnDescription: string = this._renderMarkdown(apiMethod.returnValue.description, docItem)
        .replace(/^\s*-\s+/, ''); // temporary workaround for people who mistakenly add a hyphen, e.g. "@returns - blah"

      syntax.return = {
        type: [ apiMethod.returnValue.type ],
        description: returnDescription
      };
    }

    const parameters: IYamlParameter[] = [];
    for (const parameterName of Object.keys(apiMethod.parameters)) {
      const apiParameter: IApiParameter = apiMethod.parameters[parameterName];
      parameters.push(
        {
           id: parameterName,
           description:  this._renderMarkdown(apiParameter.description, docItem),
           type: [ apiParameter.type || '' ]
        } as IYamlParameter
      );
    }

    if (parameters.length) {
      syntax.parameters = parameters;
    }

  }

  private _populateYamlProperty(yamlItem: Partial<IYamlItem>, docItem: DocItem): void {
    const apiProperty: IApiProperty = docItem.apiItem as IApiProperty;

    const syntax: IYamlSyntax = {
      content: apiProperty.signature
    };
    yamlItem.syntax = syntax;

    if (apiProperty.type) {
      syntax.return = {
        type: [ apiProperty.type ]
      };
    }
  }

  private _renderMarkdown(markupElements: MarkupElement[], containingDocItem: DocItem): string {
    if (!markupElements.length) {
      return '';
    }

    return MarkdownRenderer.renderElements(markupElements, {
      onRenderApiLink: (args: IMarkdownRenderApiLinkArgs) => {
        const result: IDocItemSetResolveResult = this._docItemSet.resolveApiItemReference(args.reference);
        if (!result.docItem) {
          // Eventually we should introduce a warnings file
          console.error('==> UNRESOLVED REFERENCE: ' + JSON.stringify(args.reference));
        } else {
          args.prefix = '[';
          args.suffix = `](xref:${this._getUid(result.docItem)})`;
        }
      }
    }).trim();
  }

  private _writeYamlFile(dataObject: {}, filePath: string, yamlMimeType: string,
    schema: JsonSchema|undefined): void {

    JsonFile.validateNoUndefinedMembers(dataObject);

    let stringified: string = yaml.safeDump(dataObject, {
      lineWidth: 120
    });

    if (yamlMimeType) {
      stringified = `### YamlMime:${yamlMimeType}\n` + stringified;
    }

    const normalized: string = stringified.split('\n').join('\r\n');

    fsx.mkdirsSync(path.dirname(filePath));
    fsx.writeFileSync(filePath, normalized);

    if (schema) {
      schema.validateObject(dataObject, filePath);
    }
  }

  /**
   * Calculate the docfx "uid" for the DocItem
   * Example:  node-core-library.JsonFile.load
   */
  private _getUid(docItem: DocItem): string {
    let result: string = '';
    for (const current of docItem.getHierarchy()) {
      switch (current.kind) {
        case DocItemKind.Package:
          result += Utilities.getUnscopedPackageName(current.name);
          break;
        default:
          result += '.';
          result += current.name;
          break;
      }
    }
    return result;
  }

  private _getYamlItemName(docItem: DocItem): string {
    if (docItem.parent && docItem.parent.kind === DocItemKind.Namespace) {
      // For members a namespace, show the full name excluding the package part:
      // Example: excel.Excel.Binding --> Excel.Binding
      return this._getUid(docItem).replace(/^[^.]+\./, '');
    }
    return docItem.name;
  }

  private _getYamlFilePath(docItem: DocItem): string {
    let result: string = '';

    for (const current of docItem.getHierarchy()) {
      switch (current.kind) {
        case DocItemKind.Package:
          result += Utilities.getUnscopedPackageName(current.name);
          break;
        default:
          result += '.';
          result += current.name;
          break;
      }
    }
    return path.join(this._outputFolder, result + '.yml');
  }

  private _deleteOldOutputFiles(): void {
    console.log('Deleting old output from ' + this._outputFolder);
    fsx.emptyDirSync(this._outputFolder);
  }
}
