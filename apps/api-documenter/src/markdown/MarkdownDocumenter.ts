// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as fsx from 'fs-extra';
import * as path from 'path';
import yaml = require('js-yaml');

import {
  IApiClass,
  IApiEnum,
  IApiEnumMember,
  IApiFunction,
  IApiInterface,
  IApiPackage,
  ApiMember,
  IApiProperty,
  ApiItem,
  IApiParameter,
  IApiMethod,
  IMarkupApiLink,
  IMarkupPage,
  IMarkupList,
  IMarkupListRow,
  IMarkupTable,
  IMarkupText,
  IMarkupWebLink,
  Markup,
  MarkupBasicElement,
  MarkupStructuredElement,
  IMarkupParagraph,
  IApiNamespace
} from '@microsoft/api-extractor';

import {
  IYamlTocFile,
  IYamlTocItem
} from './IYamlTocFile';

import {
  DocItemSet,
  DocItem,
  DocItemKind,
  IDocItemSetResolveResult
} from '../utils/DocItemSet';
import { Utilities } from '../utils/Utilities';
import { MarkdownRenderer, IMarkdownRenderApiLinkArgs } from '../utils/MarkdownRenderer';
import { normalize } from 'path';

/**
 * Renders API documentation in the Markdown file format.
 * For more info:  https://en.wikipedia.org/wiki/Markdown
 */
export class MarkdownDocumenter {
  private _docItemSet: DocItemSet;
  private _outputFolder: string;

  public constructor(docItemSet: DocItemSet) {
    this._docItemSet = docItemSet;
  }

  public generateFiles(outputFolder: string): void {
    this._outputFolder = outputFolder;

    console.log();
    this._deleteOldOutputFiles();

    for (const docPackage of this._docItemSet.docPackages) {
      this._writePackagePage(docPackage);
      this._writeTocFile(docPackage.children);   
    }

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
    this._writeYamlFile(this._sortTocItems(tocFile), tocFilePath, '');
  }

  private _sortTocItems(tocFile: IYamlTocFile): IYamlTocFile {
    const items: IYamlTocItem[] = tocFile.items;
    items.sort((a, b) => {
      if(b.items && a.items) {
        if(a.name < b.name) return -1;
        if(a.name > b.name) return 1;
      }
      if(!b.items && !a.items) {
        if(a.name < b.name) return -1;
        if(a.name > b.name) return 1;
      }
      if(b.items) {
        return 1;
      }
      if(!b.items) {
        return -1;
      }
      return 0;
    });
    return tocFile;
  }

  private _buildTocItems(docItems: DocItem[], child: boolean = false): IYamlTocItem[] {
    const tocItems: IYamlTocItem[] = [];
    for(const docItem of docItems) {
      let tocItem: IYamlTocItem;
      let docHref: string = `${this._getUid(docItem).toLowerCase()}.md`;
      if(this._shouldEmbed(docItem.kind)) {
        continue;
      }
      if(child && docItem.parent) {
        docHref = `${this._getUid(docItem.parent).toLowerCase()}.md#${docItem.name.replace(/(_|__)/g, '').toLowerCase()}`;
      }
      tocItem = {
        name: Utilities.getUnscopedPackageName(docItem.name),
        href: docHref
      };

      tocItems.push(tocItem);
      const childItems: IYamlTocItem[] = this._buildTocItems(docItem.children, true);
      if (childItems.length > 0) {
        tocItem.items = childItems;
      }
    }
    return tocItems;
  }

  private _shouldEmbed(docItemKind: DocItemKind): boolean {
    switch(docItemKind) {
      case DocItemKind.Class:
      case DocItemKind.Package:
      case DocItemKind.Interface:
      case DocItemKind.Enum:
      case DocItemKind.Function:
      case DocItemKind.Property:
      case DocItemKind.Method:
      case DocItemKind.Constructor:
      case DocItemKind.Namespace:
      return false;
    }
    return true;
  }

  private _getUid(docItem: DocItem): string {
    let result: string = '';
    for(const current of docItem.getHierarchy()) {
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

  private _writeYamlFile(dataObject: {}, filePath: string, yamlMimeType: string) {
    let stringified: string = yaml.safeDump(dataObject, {
      lineWidth: 120
    });

    const normalized: string = stringified.split('\n').join('\r\n');
    fsx.mkdirsSync(path.dirname(filePath));
    fsx.writeFileSync(filePath, normalized);
  }

  /**
   * GENERATE PAGE: PACKAGE
   */
  private _writePackagePage(docPackage: DocItem): void {
    console.log(`Writing ${docPackage.name} package`);

    const unscopedPackageName: string = Utilities.getUnscopedPackageName(docPackage.name);

    const markupPage: IMarkupPage = Markup.createPage(`${unscopedPackageName} package`);

    const apiPackage: IApiPackage = docPackage.apiItem as IApiPackage;

    markupPage.elements.push(...apiPackage.summary);

    const classesList: IMarkupList = Markup.createList();
    const interfacesList: IMarkupList = Markup.createList();
    const functionsList: IMarkupList = Markup.createList();
    const enumerationsList: IMarkupList = Markup.createList();
    const namespacesList: IMarkupList = Markup.createList();

    for (const docChild of docPackage.children) {
      const apiChild: ApiItem = docChild.apiItem;

      const docItemTitleLink: MarkupBasicElement[] = [
        Markup.createHeading3(
          [Markup.createApiLinkFromText(docChild.name, docChild.getApiReference())]
        )
      ];

      const docChildDescription: MarkupBasicElement[] = [];

      if (apiChild.isBeta) {
        docChildDescription.push(...Markup.createTextElements('(BETA)', { italics: true, bold: true }));
        docChildDescription.push(...Markup.createTextElements(' '));
      }
      docChildDescription.push(...apiChild.summary);

      switch (apiChild.kind) {
        case 'class':
          classesList.rows.push(Markup.createListRow([
            docItemTitleLink,
            [Markup.createSection(docChildDescription)]
          ]));
          this._writeClassPage(docChild);
          break;
        case 'interface':
          interfacesList.rows.push(
            Markup.createListRow([
              docItemTitleLink,
              [Markup.createSection(docChildDescription)]
            ])
          );
          this._writeInterfacePage(docChild);
          break;
        case 'function':
          functionsList.rows.push(
            Markup.createListRow([
              docItemTitleLink,
              [Markup.createSection(docChildDescription)]
            ])
          );
          this._writeFunctionPage(docChild);
          break;
        case 'enum':
          enumerationsList.rows.push(
            Markup.createListRow([
              docItemTitleLink,
              [Markup.createSection(docChildDescription)]
            ])
          );
          this._writeEnumPage(docChild);
          break;
        case 'namespace':
          namespacesList.rows.push(
            Markup.createListRow([
              docItemTitleLink,
              [Markup.createSection(docChildDescription)]
            ])
          );
          this._writeNamespacePage(docChild);
          break;
      }
    }

    if (apiPackage.remarks && apiPackage.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiPackage.remarks);
    }

    if (namespacesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Namespaces'));
      markupPage.elements.push(namespacesList);
    }

    if (classesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Classes'));
      markupPage.elements.push(classesList);
    }

    if (interfacesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Interfaces'));
      markupPage.elements.push(interfacesList);
    }

    if (functionsList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Functions'));
      markupPage.elements.push(functionsList);
    }

    if (enumerationsList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Enumerations'));
      markupPage.elements.push(enumerationsList);
    }

    this._writePage(markupPage, docPackage);
  }

  /**
   * GENERATE PAGE: NAMESPACE
   * @internalremarks
   * modified by ossiaco
   */
  private _writeNamespacePage(docNamespace: DocItem): void {
    const apiNamespace: IApiNamespace = docNamespace.apiItem as IApiNamespace;
    console.log(apiNamespace);

    const markupPage: IMarkupPage = Markup.createPage(`${docNamespace.name} namespace`);

    if (apiNamespace.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }
    markupPage.elements.push(Markup.createParagraphAndElements(apiNamespace.summary));
    
    const classesList: IMarkupList = Markup.createList();
    const interfacesList: IMarkupList = Markup.createList();
    const propertiesList: IMarkupList = Markup.createList();
    const functionsList: IMarkupList = Markup.createList();
    const enumerationsList: IMarkupList = Markup.createList();

    for (const docChild of docNamespace.children) {
      const apiChild: ApiItem = docChild.apiItem;

      const docItemTitleLink: MarkupBasicElement[] = [
        Markup.createHeading3(
          [Markup.createApiLinkFromText(docChild.name, docChild.getApiReference())]
        )
      ];

      const docChildDescription: MarkupBasicElement[] = [];

      if (apiChild.isBeta) {
        docChildDescription.push(...Markup.createTextElements('(BETA)', { italics: true, bold: true }));
        docChildDescription.push(...Markup.createTextElements(' '));
      }
      docChildDescription.push(...apiChild.summary);

      switch(apiChild.kind) {
        case 'property':
          propertiesList.rows.push(Markup.createListRow([
            docItemTitleLink,
            [Markup.createSection(docChildDescription)]
          ]));
          this._writePropertyPage(docChild);
          break;
        case 'class':
          classesList.rows.push(Markup.createListRow([
            docItemTitleLink,
            [Markup.createSection(docChildDescription)]
          ]));
          this._writeClassPage(docChild);
          break;
        case 'interface':
          interfacesList.rows.push(
            Markup.createListRow([
              docItemTitleLink,
              [Markup.createSection(docChildDescription)]
            ])
          );
          this._writeInterfacePage(docChild);
          break;
        case 'function':
          functionsList.rows.push(
            Markup.createListRow([
              docItemTitleLink,
              [Markup.createSection(docChildDescription)]
            ])
          );
          this._writeFunctionPage(docChild);
          break;
        case 'enum':
          enumerationsList.rows.push(
            Markup.createListRow([
              docItemTitleLink,
              [Markup.createSection(docChildDescription)]
            ])
          );
          this._writeEnumPage(docChild);
          break;
      }
    }

    if (classesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Classes'));
      markupPage.elements.push(classesList);
    }

    if (functionsList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Functions'));
      markupPage.elements.push(functionsList);
    }

    if (interfacesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Interfaces'));
      markupPage.elements.push(interfacesList);
    }

    if (propertiesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Properties'));
      markupPage.elements.push(propertiesList);
    }

    if (enumerationsList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Enums'));
      markupPage.elements.push(enumerationsList);
    }

    if (apiNamespace.remarks && apiNamespace.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiNamespace.remarks);
    }

    this._writePage(markupPage, docNamespace);
  }

  /**
   * GENERATE PAGE: CLASS
   */
  private _writeClassPage(docClass: DocItem): void {
    const apiClass: IApiClass = docClass.apiItem as IApiClass;

    // TODO: Show concise generic parameters with class name
    const markupPage: IMarkupPage = Markup.createPage(`${docClass.name} class`);

    const classSignature: string = `export class ${docClass.name}${apiClass.extends ? " extends " + apiClass.extends : ""}` +
        `${apiClass.implements ? " implements " + apiClass.implements : ""}`;

    if (apiClass.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }
    markupPage.elements.push(Markup.createParagraphAndElements(apiClass.summary));
    markupPage.elements.push(Markup.createHeading4('Syntax'));
    markupPage.elements.push(Markup.createCodeBox(classSignature, 'javascript'));

    const propertiesList: IMarkupList = Markup.createList();
    const methodsList: IMarkupList = Markup.createList();

    for (const docMember of docClass.children) {
      const apiMember: ApiMember = docMember.apiItem as ApiMember;

      switch (apiMember.kind) {
        case 'property':
          const propertyTitle: MarkupBasicElement[] = [
            Markup.createHeading3(docMember.name)
          ];

          propertiesList.rows.push(
            Markup.createListRow([
              propertyTitle,
              apiMember.summary,
              [Markup.PARAGRAPH],
              [Markup.createHeading4('Declaration')],
              [Markup.createCodeBox(docMember.name + ': ' + apiMember.type, 'javascript')],
              apiMember.remarks.length ? [Markup.createHeading4('Remarks')] : [],
              apiMember.remarks.length ? apiMember.remarks : []
            ])
          );
          break;

        case 'constructor':
          // TODO: Extract constructor into its own section
          const constructorTitle: MarkupBasicElement[] = [
            Markup.createHeading3(docMember.name)
          ];

          const constructorParametersTable: IMarkupTable = Markup.createTable([
            Markup.createTextElements('Type'),
            Markup.createTextElements('Name'),
            Markup.createTextElements('Description')
          ]);

          if (Object.keys(apiMember.parameters).length > 0) { 
            for (const parameterName of Object.keys(apiMember.parameters)) {
              const apiParameter: IApiParameter = apiMember.parameters[parameterName];
                constructorParametersTable.rows.push(Markup.createTableRow([
                  apiParameter.type ? Markup.createTextElements(apiParameter.type) : [],
                  Markup.createTextElements(parameterName, {italics: true}),
                  apiParameter.description
                ])
              );
            }
          }

          methodsList.rows.push(
            Markup.createListRow([
              constructorTitle,
              apiMember.summary,
              [Markup.PARAGRAPH],
              [Markup.createHeading4('Declaration')],
              [Markup.createCodeBox(apiMember.signature, 'javascript')],
              Object.keys(apiMember.parameters).length ? [Markup.createHeading4('Parameters')] : [],
              Object.keys(apiMember.parameters).length ? [constructorParametersTable] : [],
              apiMember.remarks.length ? [Markup.createHeading4('Remarks')] : [],
              apiMember.remarks.length ? apiMember.remarks : []
            ])
          );
          break;

        case 'method':
          const methodTitle: MarkupBasicElement[] = [
            Markup.createHeading3(docMember.name)
          ];

          const methodParametersTable: IMarkupTable = Markup.createTable([
            Markup.createTextElements('Type'),
            Markup.createTextElements('Name'),
            Markup.createTextElements('Description')
          ]);

          const returnsTable: IMarkupTable = Markup.createTable([
            Markup.createTextElements('Type'),
            Markup.createTextElements('Description')
          ]);

          if (Object.keys(apiMember.parameters).length > 0) { 
            for (const parameterName of Object.keys(apiMember.parameters)) {
              const apiParameter: IApiParameter = apiMember.parameters[parameterName];
                methodParametersTable.rows.push(Markup.createTableRow([
                  apiParameter.type ? Markup.createTextElements(apiParameter.type) : [],
                  Markup.createTextElements(parameterName, {italics: true}),
                  apiParameter.description
                ])
              );
            }
          }
          
          returnsTable.rows.push(Markup.createTableRow([
            Markup.createTextElements(apiMember.returnValue.type),
            apiMember.returnValue.description
          ]));

          methodsList.rows.push(
            Markup.createListRow([
              methodTitle,
              apiMember.summary,
              [Markup.PARAGRAPH],
              [Markup.createHeading4('Declaration')],
              [Markup.createCodeBox(apiMember.signature, 'javascript')],
              Object.keys(apiMember.parameters).length ? [Markup.createHeading4('Parameters')] : [],
              Object.keys(apiMember.parameters).length ? [methodParametersTable] : [],
              apiMember.returnValue ? [Markup.createHeading4('Returns')] : [],
              apiMember.returnValue ? [returnsTable] : [],
              apiMember.remarks.length ? [Markup.createHeading4('Remarks')] : [],
              apiMember.remarks.length ? apiMember.remarks : []
            ])
          );
          break;
      }
    }

    if (propertiesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Properties'));
      markupPage.elements.push(propertiesList);
    }

    if (methodsList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Methods'));
      markupPage.elements.push(methodsList);
    }

    if (apiClass.remarks && apiClass.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiClass.remarks);
    }

    this._writePage(markupPage, docClass);
  }

  /**
   * GENERATE PAGE: INTERFACE
   */
  private _writeInterfacePage(docInterface: DocItem): void {
    const apiInterface: IApiInterface = docInterface.apiItem as IApiInterface;

    // TODO: Show concise generic parameters with class name
    const markupPage: IMarkupPage = Markup.createPage(`${docInterface.name} interface`);

    const interfaceSignature: string = `export interface ${docInterface.name}${apiInterface.extends ? " extends " + apiInterface.extends : ""}` +
        `${apiInterface.implements ? " implements " + apiInterface.implements : ""}`;

    if (apiInterface.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }

    markupPage.elements.push(Markup.createParagraphAndElements(apiInterface.summary));
    markupPage.elements.push(Markup.createHeading4('Syntax'));
    markupPage.elements.push(Markup.createCodeBox(interfaceSignature, 'javascript'));

    const propertiesList: IMarkupList = Markup.createList();
    const methodsList: IMarkupList = Markup.createList();

    for (const docMember of docInterface.children) {
      const apiMember: ApiMember = docMember.apiItem as ApiMember;

      switch (apiMember.kind) {
        case 'property':
          const propertyTitle: MarkupBasicElement[] = [
            Markup.createHeading3(docMember.name)
          ];

          propertiesList.rows.push(
            Markup.createListRow([
              propertyTitle,
              apiMember.summary,
              [Markup.PARAGRAPH],
              [Markup.createHeading4('Declaration')],
              [Markup.createCodeBox(apiMember.signature, 'javascript')],
              apiMember.remarks.length ? [Markup.createHeading4('Remarks')] : [],
              apiMember.remarks.length ? apiMember.remarks : []
            ])
          );
          break;

        case 'method':
          const methodTitle: MarkupBasicElement[] = [
            Markup.createHeading3(docMember.name)
          ];

          const methodParametersTable: IMarkupTable = Markup.createTable([
            Markup.createTextElements('Type'),
            Markup.createTextElements('Name'),
            Markup.createTextElements('Description')
          ]);

          const returnsTable: IMarkupTable = Markup.createTable([
            Markup.createTextElements('Type'),
            Markup.createTextElements('Description')
          ]);

          if (Object.keys(apiMember.parameters).length > 0) { 
            for (const parameterName of Object.keys(apiMember.parameters)) {
              const apiParameter: IApiParameter = apiMember.parameters[parameterName];
                methodParametersTable.rows.push(Markup.createTableRow([
                  apiParameter.type ? Markup.createTextElements(apiParameter.type) : [],
                  Markup.createTextElements(parameterName, {italics: true}),
                  apiParameter.description
                ])
              );
            }
          }
          
          returnsTable.rows.push(Markup.createTableRow([
            Markup.createTextElements(apiMember.returnValue.type),
            apiMember.returnValue.description
          ]));

          methodsList.rows.push(
            Markup.createListRow([
              methodTitle,
              apiMember.summary,
              [Markup.PARAGRAPH],
              [Markup.createHeading4('Declaration')],
              [Markup.createCodeBox(apiMember.signature, 'javascript')],
              Object.keys(apiMember.parameters).length ? [Markup.createHeading4('Parameters')] : [],
              Object.keys(apiMember.parameters).length ? [methodParametersTable] : [],
              apiMember.returnValue ? [Markup.createHeading4('Returns')] : [],
              apiMember.returnValue ? [returnsTable] : [],
              apiMember.remarks.length ? [Markup.createHeading4('Remarks')] : [],
              apiMember.remarks.length ? apiMember.remarks : []
            ])
          );
          break;
      }
    }

    if (propertiesList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Properties'));
      markupPage.elements.push(propertiesList);
    }

    if (methodsList.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Methods'));
      markupPage.elements.push(methodsList);
    }

    if (apiInterface.remarks && apiInterface.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiInterface.remarks);
    }

    this._writePage(markupPage, docInterface);
  }

  /**
   * GENERATE PAGE: ENUM
   */
  private _writeEnumPage(docEnum: DocItem): void {
    const apiEnum: IApiEnum = docEnum.apiItem as IApiEnum;

    // TODO: Show concise generic parameters with class name
    const markupPage: IMarkupPage = Markup.createPage(`${docEnum.name} enumeration`);

    const enumSignature: string = `export enum ${docEnum.name}`;

    if (apiEnum.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }

    markupPage.elements.push(Markup.createParagraphAndElements(apiEnum.summary));
    markupPage.elements.push(Markup.createHeading4('Syntax'));
    markupPage.elements.push(Markup.createCodeBox(enumSignature, 'javascript'));

    const membersTable: IMarkupTable = Markup.createTable([
      Markup.createTextElements('Member'),
      Markup.createTextElements('Value'),
      Markup.createTextElements('Description')
    ]);

    for (const docEnumMember of docEnum.children) {
      const apiEnumMember: IApiEnumMember = docEnumMember.apiItem as IApiEnumMember;

      const enumValue: MarkupBasicElement[] = [];

      if (apiEnumMember.value) {
        enumValue.push(Markup.createCode('= ' + apiEnumMember.value));
      }

      membersTable.rows.push(
        Markup.createTableRow([
          Markup.createTextElements(docEnumMember.name),
          enumValue,
          apiEnumMember.summary
        ])
      );
    }

    if (membersTable.rows.length > 0) {
      markupPage.elements.push(membersTable);
    }

    this._writePage(markupPage, docEnum);
  }

  /**
   * GENERATE PAGE: PROPERTY
   */
  private _writePropertyPage(docProperty: DocItem): void {
    const apiProperty: IApiProperty = docProperty.apiItem as IApiProperty;
    const fullProperyName: string = docProperty.parent!.name + '.' + docProperty.name;

    const markupPage: IMarkupPage = Markup.createPage(`${fullProperyName} property`);

    if (apiProperty.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }

    markupPage.elements.push(Markup.createParagraphAndElements(apiProperty.summary));

    markupPage.elements.push(Markup.PARAGRAPH);
    markupPage.elements.push(...Markup.createTextElements('Signature:', { bold: true }));
    markupPage.elements.push(Markup.createCodeBox(docProperty.name + ': ' + apiProperty.type, 'javascript'));

    if (apiProperty.remarks && apiProperty.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiProperty.remarks);
    }

    this._writePage(markupPage, docProperty);
  }

  /**
   * GENERATE PAGE: FUNCTION
   */
  private _writeFunctionPage(docFunction: DocItem): void {
    const apiFunction: IApiFunction = docFunction.apiItem as IApiFunction;

    const markupPage: IMarkupPage = Markup.createPage(`${docFunction.name} function`);

    const returnsTable: IMarkupTable = Markup.createTable([
      Markup.createTextElements('Type'),
      Markup.createTextElements('Description')
    ]);

    returnsTable.rows.push(Markup.createTableRow([
      Markup.createTextElements(apiFunction.returnValue.type),
      apiFunction.returnValue.description
    ]));

    if (apiFunction.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }
    markupPage.elements.push(Markup.createParagraphAndElements(apiFunction.summary));

    markupPage.elements.push(Markup.PARAGRAPH);
    markupPage.elements.push(Markup.createHeading4('Declaration'));
    markupPage.elements.push(Markup.createCodeBox(apiFunction.signature, 'javascript'));

    if (Object.keys(apiFunction.parameters).length > 0) {
      const parametersTable: IMarkupTable = Markup.createTable([
        Markup.createTextElements('Type'),
        Markup.createTextElements('Name'),
        Markup.createTextElements('Description')
      ]);

      markupPage.elements.push(Markup.createHeading4('Parameters'));
      markupPage.elements.push(parametersTable);
      for (const parameterName of Object.keys(apiFunction.parameters)) {
        const apiParameter: IApiParameter = apiFunction.parameters[parameterName];
          parametersTable.rows.push(Markup.createTableRow([
            apiParameter.type ? Markup.createTextElements(apiParameter.type) : [],
            Markup.createTextElements(parameterName, {italics: true}),
            apiParameter.description
          ])
        );
      }
    }

    if (apiFunction.returnValue) {
      markupPage.elements.push(Markup.createHeading4('Returns'));
      markupPage.elements.push(returnsTable);
    }

    if (apiFunction.remarks && apiFunction.remarks.length) {
      markupPage.elements.push(Markup.createHeading4('Remarks'));
      markupPage.elements.push(...apiFunction.remarks);
    }

    this._writePage(markupPage, docFunction);
  }

  private _writeBetaWarning(elements: MarkupStructuredElement[]): void {
    const betaWarning: string = 'This API is provided as a preview for developers and may change'
      + ' based on feedback that we receive.  Do not use this API in a production environment.';
    elements.push(
      Markup.createNoteBoxFromText(betaWarning)
    );
  }

  private _writePage(markupPage: IMarkupPage, docItem: DocItem): void { // override
    const filename: string = path.join(this._outputFolder, this._getFilenameForDocItem(docItem));

    const content: string = MarkdownRenderer.renderElements([markupPage], {
      onRenderApiLink: (args: IMarkdownRenderApiLinkArgs) => {
        const resolveResult: IDocItemSetResolveResult = this._docItemSet.resolveApiItemReference(args.reference);
        if (!resolveResult.docItem) {
          throw new Error('Unresolved: ' + JSON.stringify(args.reference));
        }

        const docFilename: string = this._getFilenameForDocItem(resolveResult.docItem);
        args.prefix = '[';
        args.suffix = '](' + docFilename + ')';
      }
    });

    fsx.writeFileSync(filename, content);
  }

  private _getFilenameForDocItem(docItem: DocItem): string {
    let baseName: string = '';
    for (const part of docItem.getHierarchy()) {
      if (part.kind === DocItemKind.Package) {
        baseName = Utilities.getUnscopedPackageName(part.name);
      } else {
        baseName += '.' + part.name;
      }
    }
    return baseName.toLowerCase() + '.md';
  }

  private _deleteOldOutputFiles(): void {
    console.log('Deleting old output from ' + this._outputFolder);
    fsx.emptyDirSync(this._outputFolder);
  }
}
