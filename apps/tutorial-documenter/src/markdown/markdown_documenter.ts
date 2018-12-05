import {DocItemSet} from '../utils/doc_item_set';
import {DocItem} from '../utils/doc_item';
import {
  FileSystem,
  PackageName
} from '@microsoft/node-core-library';
import {
  Markup,
  ApiItem,
  IApiTutorial,
  IMarkupPage,
  MarkupStructuredElement,
  MarkupElement,
  ApiMember,
  IMarkupList,
  IMarkupListRow
} from '@ossiaco/tutorial-extractor';
import * as path from 'path';
import {dirname} from 'path';
import { DocItemKind } from '../utils/doc_item.types';
import { MarkdownRenderer } from '../utils/markdown_renderer';
import { IMarkdownRenderApiLinkArgs } from '../utils/markdown_renderer.types';
import {IDocItemSetResolveResult} from '../utils/doc_item_set.types';
import * as colors from 'colors';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';

// tslint:disable-next-line:export-name
export class MarkdownDocumenter {
  private _docItemSet: DocItemSet;
  private _outputFolder: string | undefined;
  constructor(docItemSet: DocItemSet) {
    this._docItemSet = docItemSet;
    this._outputFolder = undefined;
  }

  public generateFiles(outputFolder: string): void {
    this._outputFolder = outputFolder;
    this._deleteOldOutputFiles();

    for (const docPackage of this._docItemSet.docPackages) {
      this._writePackages(docPackage);
    }
  }

  private _writePackages(docPackage: DocItem): void {
    console.log(`Writing ${docPackage.name} package`);

    const markupTutorials: IMarkupPage = Markup.createPage();
    const categoryList: IMarkupList = Markup.createList();

    for (const docChild of docPackage.children) {
        const apiChild: ApiItem = docChild.apiItem;

        switch (apiChild.kind) {
          case 'tutorial':
            let categoryIndex: number = -1;
            const filterCategory: IMarkupListRow[] = categoryList.rows.filter((row: IMarkupListRow, index: number) => {
              categoryIndex = index;
              return row.category === apiChild.category;
            });

            const categoryListItem: MarkupElement[] = new Array<MarkupElement>(
              Markup.createHtmlTag('<li>'),
                Markup.createApiLink(new Array<MarkupElement>(
                    Markup.createHtmlTag('<i class="glyphicon glyphicon-triangle-right"/>'),
                    ...apiChild.tutorialName
                ),
                  docChild.getApiReference()
                ),
              Markup.createHtmlTag('</li>')
            );

            // If the category doesn't exist, create it.
            if (filterCategory.length <= 0) {
              categoryList.rows.push(Markup.createListRow(new Array<Array<MarkupElement>>(
                  new Array<MarkupElement>(
                    Markup.createHtmlTag('<div class="chorus_typescript_item">'),
                    Markup.createHtmlTag('<h3>'),
                    ...apiChild.category,
                    Markup.createHtmlTag('</h3>'),
                    Markup.createHtmlTag('<ul class="chorus_typescript_list">'),
                    Markup.createHtmlTag('</ul>'),
                    Markup.createHtmlTag('</div>')
                  )
              )));
              categoryList.rows[categoryList.rows.length - 1].cells[0].elements.splice(
                categoryList.rows[categoryList.rows.length - 1].cells[0].elements.length - 2,
                0,
                ...categoryListItem
              );
            } else {
              const existingCategory: IMarkupListRow = categoryList.rows[categoryIndex];
              categoryList.rows[categoryIndex].cells[0].elements.splice(
                existingCategory.cells[0].elements.length - 2,
                0,
                ...categoryListItem
              );
            }
            this._writeTutorialPage(docChild);
            break;
        }
    }

    if (categoryList.rows.length > 0) {
      markupTutorials.elements.push(
        Markup.createHtmlTag('<h2>'),
        ...Markup.createTextElements('Tutorials'),
        Markup.createHtmlTag('</h2>')
      );
      markupTutorials.elements.push(Markup.createHtmlTag('<div class="chorus_typescript_wrapper">'));
      markupTutorials.elements.push(categoryList);
      markupTutorials.elements.push(Markup.createHtmlTag('</div>'));
    }

    this._writePage(markupTutorials, docPackage);
  }

  private _writeTutorialPage(docTutorial: DocItem): void {
    const apiTutorial: IApiTutorial = docTutorial.apiItem as IApiTutorial;
    let tutorialName: string = '';
    const markupElement: (i: number) => MarkupElement = (i: number) => apiTutorial.tutorialName[i];
    for (let i: number = 0; i < apiTutorial.tutorialName.length; ++i) {
      if (markupElement(i).kind !== 'text') {
        continue;
      }
      // tslint:disable-next-line:no-string-literal
      tutorialName += markupElement(i)['text'];
    }
    const markupPage: IMarkupPage = Markup.createPage(tutorialName);

    if (apiTutorial.deprecatedMessage && apiTutorial.deprecatedMessage.length > 0) {
      markupPage.elements.push(Markup.createHtmlTag('<h1>'));
      markupPage.elements.push(...Markup.createTextElements('Deprecated'));
      markupPage.elements.push(Markup.createHtmlTag('</h1>'));
      markupPage.elements.push(...apiTutorial.deprecatedMessage);
    }
    markupPage.elements.push(Markup.createParagraphAndElements(apiTutorial.summary));

    if (apiTutorial.isBeta) {
      this._writeBetaWarning(markupPage.elements);
    }

    const stepList: IMarkupList = Markup.createList();

    for (const docChild of docTutorial.children) {
      const apiChild: ApiMember = docChild.apiItem as ApiMember;

      switch (apiChild.kind) {
        case 'step':
          const stepTitle: MarkupElement[] = [
            Markup.createHtmlTag('<h3>'),
            ...apiChild.stepName,
            Markup.createHtmlTag('</h3>')
          ];
          const remarks: MarkupElement[] = [
            Markup.createHtmlTag('<h2>'),
            ...apiChild.remarks,
            Markup.createHtmlTag('</h2>')
          ];
          stepList.rows.push(Markup.createListRow([
            stepTitle,
            apiChild.remarks.length ? remarks : [],
            apiChild.summary,
            [Markup.PARAGRAPH],
            apiChild.code,
            apiChild.codeDescription
          ]));
          break;
      }
    }

    if (stepList.rows.length > 0) {
      markupPage.elements.push(stepList);
    }

    this._writePage(markupPage, docTutorial);
  }

  private _writePage(markupPage: IMarkupPage, docItem: DocItem): void {
    const filename: string = path.join(this._outputFolder!, this._getFilenameForDocItem(docItem));
    const content: string = MarkdownRenderer.renderElements([markupPage], {
      onRenderApiLink: (args: IMarkdownRenderApiLinkArgs) => {
        const resolveResult: IDocItemSetResolveResult = this._docItemSet.resolveApiItemReference(args.reference);
        if (!resolveResult.docItem) {
          // Eventually we should introduced a warnings file
          console.error(colors.yellow('Warning: Unresolved hyperlink to ' +
          Markup.formatApiItemReference(args.reference)
          ));
        } else {
          // NOTE: GitHub's markdown renderer does not resolve relative hyperlinks correctly
          // unless they start with "./" or "../".
          const docFileName: string = './' + this._getFilenameForDocItem(resolveResult.docItem);
          args.prefix = '[';
          args.suffix = '](' + docFileName + ')';
        }
      }
    });
    mkdirp(dirname(filename), (err: Error) => {
      if (err) {
        throw err;
      }
      fs.writeFileSync(filename, content);
    });
  }

  private _getFilenameForDocItem(docItem: DocItem): string {
    let baseName: string = '';
    for (const part of docItem.getHierarchy()) {
      if (part.kind === DocItemKind.Package) {
        baseName = PackageName.getUnscopedName(part.name);
      } else {
        baseName += '.' + part.name;
      }
    }
    return baseName.toLowerCase() + '.md';
  }

  private _writeBetaWarning(elements: MarkupStructuredElement[]): void {
    const betaWarning: string = 'This API is provided as a preview for developers and may change'
    + ' based on feedback that we receive.  Do not use this API in a production environment.';
    elements.push(
      Markup.createNoteBoxFromText(betaWarning)
    );
  }

  private _deleteOldOutputFiles(): void {
    console.log('Deleting old output from ' + this._outputFolder);
    if (this._outputFolder) {
      FileSystem.ensureEmptyFolder(this._outputFolder);
    }
  }
}