import {
    CommandLineParser
} from '@microsoft/ts-command-line';
import { MarkDownAction } from './mardown_action';

// tslint:disable-next-line:export-name
export class TutorialDocumenterCommandLine extends CommandLineParser {
    constructor () {
        super({
            toolFilename: 'tutorial-documenter',
            toolDescription: 'Reads *.api.json files produced by tutorial-extractor, '
                + ' and generates API documentation in various output formats.'
        });
        this._populateActions();
    }

    protected onDefineParameters (): void { // override

    }

    private _populateActions (): void {
        this.addAction(new MarkDownAction(this));
    }
}