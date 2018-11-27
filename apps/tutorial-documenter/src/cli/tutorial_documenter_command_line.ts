import {
    CommandLineParser,
    ICommandLineParserOptions
} from '@microsoft/ts-command-line';
import { MarkDownAction } from './mardown_action';

// tslint:disable-next-line:export-name
export class TutorialDocumenterCommandLine extends CommandLineParser {
    constructor (_parse?: ICommandLineParserOptions) {
        super({
            toolFilename: 'tutorial-documenter',
            toolDescription: 'Reads *.api.json files produced by tutorial-extractor, '
                + ' and generates API documentation in various output formats.'
        });
        this._populateActions();
    }

    protected onDefineParameters (): void { // override
        // No parameters
    }

    private _populateActions (): void {
        this.addAction(new MarkDownAction(this));
    }
}