import { DocItemSet } from '../utils/doc_item_set';
import { BaseAction } from './base_action';
import { TutorialDocumenterCommandLine } from './tutorial_documenter_command_line';

// tslint:disable-next-line:export-name
export class MarkDownAction extends BaseAction {
    constructor (_parse: TutorialDocumenterCommandLine) {
        super({
            actionName: 'markdown',
            summary: 'Generate documentation as Markdown files (*.md)',
            documentation: 'Generates API documentation as a collection of files in' +
                ' Markdown format, suitable for example for publishing on Github site.'
        });
    }

    protected onExecute (): Promise<void> {
        const docItemSet: DocItemSet = this.buildDocItemSet();
        console.log(docItemSet);
        return Promise.resolve();
    }

    // tslint:disable-next-line:no-empty
    protected onDefineParameters (): void {

    }
}