import { AstItem } from './ast_item';
import { AstItemKind, IAstItemOptions } from './ast_item.types';
import { AstItemContainer } from './ast_item_container';
import { AstStep } from './ast_step';
import { IAstTutorialOptions } from './ast_tutorial.types';

export class AstTutorial extends AstItemContainer {
    /** The steps to be processed */
    protected steps: string[];
    constructor (options: IAstTutorialOptions) {
        super(options);
        this.kind = AstItemKind.Tutorial;
        this.steps = options.steps;

        this._processMember();
    }

    getSortedMemberItems (): AstItem[] {
        for (const astItem of this.innerItems) {
            if (!astItem.documentation.stepIndex) {
                continue;
            }
            const filter: AstItem[] = this.innerItems.filter((value: AstItem) => {
                return value.documentation.stepIndex === astItem.documentation.stepIndex;
            });
            if (filter.length > 1) {
                this.reportWarning(`This document contains` +
                    ` \"@stepindex ${astItem.documentation.stepIndex}\" more than once`);
            }
        }
        return this.innerItems.sort((a: AstItem, b: AstItem) => {
            if (!a.documentation.stepIndex || !b.documentation.stepIndex) {
                return 1;
            }
            return a.documentation.stepIndex - b.documentation.stepIndex;
        });
    }

    protected onCompleteInitialization (): void {
        super.onCompleteInitialization();

        if (!this.documentation.isTutorial ||
            !this.documentation.tutorialName.length) {
                this.hasIncompleteTags = true;
            }

        if (!this.documentation.isTutorial) {
            this.reportError('The @tutorial tag needs to be applied to the AEDoc file');
        }

        if (!this.documentation.tutorialName.length) {
            this.reportError('The @tutorialname tag needs to be applied to the AEDoc file');
        }
    }

    private _processMember (): void {
        for (let i = 0; i < this.steps.length; i++) {
            const options: IAstItemOptions = {
                context: this.context,
                declaration: this.declaration,
                declarationSymbol: this.declarationSymbol,
                exportSymbol: this.exportSymbol,
                sourceFileText: this.steps[i]
            }
            this.addMemberItem(new AstStep(options));
        }
    }
}