import { AstItem } from './ast_item';
import {
    AstItemKind,
    IAstItemOptions
} from './ast_item.types';

export class AstStep extends AstItem {
    constructor (options: IAstItemOptions) {
        super(options);
        this.kind = AstItemKind.Step;
    }

    protected onCompleteInitialization (): void {
        super.onCompleteInitialization();

        if (!this.documentation.stepIndex ||
            !this.documentation.stepName.length) {
                this.hasIncompleteTags = true;
            }

        if (!this.documentation.stepIndex) {
            this.reportWarning(`The step doesn't contain a \"@stepindex\" value`);
        }

        if (!this.documentation.stepName.length) {
            this.reportError(`The step name tag (@stepname) isn't specified`);
        }
    }
}