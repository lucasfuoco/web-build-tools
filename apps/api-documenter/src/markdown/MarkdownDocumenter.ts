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
  IMarkupParagraph
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

  private _buildTocItems(docItems: DocItem[]): IYamlTocItem[] {
    const tocItems: IYamlTocItem[] = [];
    for(const docItem of docItems) {
      let tocItem: IYamlTocItem;
      if(this._shouldEmbed(docItem.kind)) {
        continue;
      }

      tocItem = {
        name: Utilities.getUnscopedPackageName(docItem.name),
        href: this._getUid(docItem).toLowerCase() + ".md"
      };

      tocItems.push(tocItem);
      const childItems: IYamlTocItem[] = this._buildTocItems(docItem.children);
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
      }
    }

    if (apiPackage.remarks && apiPackage.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiPackage.remarks);
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
   * GENERATE PAGE: CLASS
   */
  private _writeClassPage(docClass: DocItem): void {
    const apiClass: IApiClass = docClass.apiItem as IApiClass;

    // TODO: Show concise generic parameters with class name
    const markupPage: IMarkupPage = Markup.createPage(`${docClass.name} class`);

    const summaryParagraph = {kind: Markup.PARAGRAPH.kind} as IMarkupParagraph;
    apiClass.summary.map((value: IMarkupText) => summaryParagraph['text'] = value.text);

    if (apiClass.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }
    markupPage.elements.push(summaryParagraph);

    const propertiesTable: IMarkupTable = Markup.createTable([
      Markup.createTextElements('Property'),
      Markup.createTextElements('Access Modifier'),
      Markup.createTextElements('Type'),
      Markup.createTextElements('Description')
    ]);

    const methodsTable: IMarkupTable = Markup.createTable([
      Markup.createTextElements('Method'),
      Markup.createTextElements('Access Modifier'),
      Markup.createTextElements('Returns'),
      Markup.createTextElements('Description')
    ]);

    for (const docMember of docClass.children) {
      const apiMember: ApiMember = docMember.apiItem as ApiMember;

      switch (apiMember.kind) {
        case 'property':
          const propertyTitle: MarkupBasicElement[] = [
            Markup.createApiLink(
              [Markup.createCode(docMember.name, 'javascript')],
              docMember.getApiReference())
          ];

          propertiesTable.rows.push(
            Markup.createTableRow([
              propertyTitle,
              [],
              [Markup.createCode(apiMember.type, 'javascript')],
              apiMember.summary
            ])
          );
          this._writePropertyPage(docMember);
          break;

        case 'constructor':
          // TODO: Extract constructor into its own section
          const constructorTitle: MarkupBasicElement[] = [
            Markup.createApiLink(
              [Markup.createCode(Utilities.getConciseSignature(docMember.name, apiMember), 'javascript')],
              docMember.getApiReference())
          ];

          methodsTable.rows.push(
            Markup.createTableRow([
              constructorTitle,
              [],
              [],
              apiMember.summary
            ])
          );
          this._writeMethodPage(docMember);
          break;

        case 'method':
          const methodTitle: MarkupBasicElement[] = [
            Markup.createApiLink(
              [Markup.createCode(Utilities.getConciseSignature(docMember.name, apiMember), 'javascript')],
              docMember.getApiReference())
          ];

          methodsTable.rows.push(
            Markup.createTableRow([
              methodTitle,
              apiMember.accessModifier ? [Markup.createCode(apiMember.accessModifier, 'javascript')] : [],
              apiMember.returnValue ? [Markup.createCode(apiMember.returnValue.type, 'javascript')] : [],
              apiMember.summary
            ])
          );
          this._writeMethodPage(docMember);
          break;
      }
    }

    if (propertiesTable.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Properties'));
      markupPage.elements.push(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Methods'));
      markupPage.elements.push(methodsTable);
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

    const summaryParagraph = {kind: Markup.PARAGRAPH.kind} as IMarkupParagraph;
    apiInterface.summary.map((value: IMarkupText) => summaryParagraph['text'] = value.text);

    if (apiInterface.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }

    markupPage.elements.push(summaryParagraph);

    const propertiesTable: IMarkupTable = Markup.createTable([
      Markup.createTextElements('Property'),
      Markup.createTextElements('Type'),
      Markup.createTextElements('Description')
    ]);

    const methodsTable: IMarkupTable = Markup.createTable([
      Markup.createTextElements('Method'),
      Markup.createTextElements('Returns'),
      Markup.createTextElements('Description')
    ]);

    for (const docMember of docInterface.children) {
      const apiMember: ApiMember = docMember.apiItem as ApiMember;

      switch (apiMember.kind) {
        case 'property':
          const propertyTitle: MarkupBasicElement[] = [
            Markup.createApiLink(
              [Markup.createCode(docMember.name, 'javascript')],
              docMember.getApiReference())
          ];

          propertiesTable.rows.push(
            Markup.createTableRow([
              propertyTitle,
              [Markup.createCode(apiMember.type)],
              apiMember.summary
            ])
          );
          this._writePropertyPage(docMember);
          break;

        case 'method':
          const methodTitle: MarkupBasicElement[] = [
            Markup.createApiLink(
              [Markup.createCode(Utilities.getConciseSignature(docMember.name, apiMember), 'javascript')],
              docMember.getApiReference())
          ];

          methodsTable.rows.push(
            Markup.createTableRow([
              methodTitle,
              apiMember.returnValue ? [Markup.createCode(apiMember.returnValue.type, 'javascript')] : [],
              apiMember.summary
            ])
          );
          this._writeMethodPage(docMember);
          break;
      }
    }

    if (propertiesTable.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Properties'));
      markupPage.elements.push(propertiesTable);
    }

    if (methodsTable.rows.length > 0) {
      markupPage.elements.push(Markup.createHeading1('Methods'));
      markupPage.elements.push(methodsTable);
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

    const summaryParagraph = {kind: Markup.PARAGRAPH.kind} as IMarkupParagraph;
    apiEnum.summary.map((value: IMarkupText) => summaryParagraph['text'] = value.text);

    if (apiEnum.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }

    markupPage.elements.push(summaryParagraph);

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

    const summaryParagraph = {kind: Markup.PARAGRAPH.kind} as IMarkupParagraph;
    apiProperty.summary.map((value: IMarkupText) => summaryParagraph['text'] = value.text);

    if (apiProperty.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }

    markupPage.elements.push(summaryParagraph);

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
   * GENERATE PAGE: METHOD
   */
  private _writeMethodPage(docMethod: DocItem): void {
    const apiMethod: IApiMethod = docMethod.apiItem as IApiMethod;

    const fullMethodName: string = docMethod.parent!.name + '.' + docMethod.name;

    const markupPage: IMarkupPage = Markup.createPage(`${fullMethodName} method`);

    const summaryParagraph = {kind: Markup.PARAGRAPH.kind} as IMarkupParagraph;
    apiMethod.summary.map((value: IMarkupText) => summaryParagraph['text'] = value.text);

    if (apiMethod.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }
    markupPage.elements.push(summaryParagraph);

    markupPage.elements.push(Markup.PARAGRAPH);
    markupPage.elements.push(...Markup.createTextElements('Signature:', { bold: true }));
    markupPage.elements.push(Markup.createCodeBox(apiMethod.signature, 'javascript'));

    if (apiMethod.returnValue) {
      markupPage.elements.push(...Markup.createTextElements('Returns:', { bold: true }));
      markupPage.elements.push(...Markup.createTextElements(' '));
      markupPage.elements.push(Markup.createCode(apiMethod.returnValue.type, 'javascript'));
      markupPage.elements.push(Markup.PARAGRAPH);
      markupPage.elements.push(...apiMethod.returnValue.description);
    }

    if (apiMethod.remarks && apiMethod.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiMethod.remarks);
    }

    if (Object.keys(apiMethod.parameters).length > 0) {
      const parametersTable: IMarkupTable = Markup.createTable([
        Markup.createTextElements('Parameter'),
        Markup.createTextElements('Type'),
        Markup.createTextElements('Description')
      ]);

      markupPage.elements.push(Markup.createHeading1('Parameters'));
      markupPage.elements.push(parametersTable);
      for (const parameterName of Object.keys(apiMethod.parameters)) {
        const apiParameter: IApiParameter = apiMethod.parameters[parameterName];
          parametersTable.rows.push(Markup.createTableRow([
            [Markup.createCode(parameterName, 'javascript')],
            apiParameter.type ? [Markup.createCode(apiParameter.type, 'javascript')] : [],
            apiParameter.description
          ])
        );
      }
    }
    this._writePage(markupPage, docMethod);
  }

  /**
   * GENERATE PAGE: FUNCTION
   */
  private _writeFunctionPage(docFunction: DocItem): void {
    const apiFunction: IApiFunction = docFunction.apiItem as IApiFunction;

    const markupPage: IMarkupPage = Markup.createPage(`${docFunction.name} function`);

    const summaryParagraph = {kind: Markup.PARAGRAPH.kind} as IMarkupParagraph;
    apiFunction.summary.map((value: IMarkupText) => summaryParagraph['text'] = value.text);

    if (apiFunction.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }
    markupPage.elements.push(summaryParagraph);

    markupPage.elements.push(Markup.PARAGRAPH);
    markupPage.elements.push(...Markup.createTextElements('Signature:', { bold: true }));
    markupPage.elements.push(Markup.createCodeBox(docFunction.name, 'javascript'));

    if (apiFunction.returnValue) {
      markupPage.elements.push(...Markup.createTextElements('Returns:', { bold: true }));
      markupPage.elements.push(...Markup.createTextElements(' '));
      markupPage.elements.push(Markup.createCode(apiFunction.returnValue.type, 'javascript'));
      markupPage.elements.push(Markup.PARAGRAPH);
      markupPage.elements.push(...apiFunction.returnValue.description);
    }

    if (apiFunction.remarks && apiFunction.remarks.length) {
      markupPage.elements.push(Markup.createHeading1('Remarks'));
      markupPage.elements.push(...apiFunction.remarks);
    }

    if (Object.keys(apiFunction.parameters).length > 0) {
      const parametersTable: IMarkupTable = Markup.createTable([
        Markup.createTextElements('Parameter'),
        Markup.createTextElements('Type'),
        Markup.createTextElements('Description')
      ]);

      markupPage.elements.push(Markup.createHeading1('Parameters'));
      markupPage.elements.push(parametersTable);
      for (const parameterName of Object.keys(apiFunction.parameters)) {
        const apiParameter: IApiParameter = apiFunction.parameters[parameterName];
          parametersTable.rows.push(Markup.createTableRow([
            [Markup.createCode(parameterName, 'javascript')],
            apiParameter.type ? [Markup.createCode(apiParameter.type, 'javascript')] : [],
            apiParameter.description
          ])
        );
      }
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
