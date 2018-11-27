import { Symbol, SymbolFlags } from 'typescript';
import {UtilDocElementParser} from '../utils/util_doc_element_parser';
import { UtilTypescriptHelpers } from '../utils/util_typescript_helpers';
import {IAstItemOptions} from './ast_item.types';
import { AstItemContainer } from './ast_item_container';
import { AstTutorial } from './ast_tutorial';
import { IAstTutorialOptions } from './ast_tutorial.types';

export class AstModule extends AstItemContainer {
    private static _getTutorialOptions(options: IAstItemOptions): IAstTutorialOptions {
        const {
            declaration,
            context
        } = options;
        const sourceFileText: string = declaration.getSourceFile().text;
        const reportError = (message: string) => context.reportError(message, declaration.getSourceFile(), declaration.getStart());
        const steps: string[] = UtilDocElementParser.parseSteps(sourceFileText, reportError);

        // Remove steps from source file text
        let tutorialText: string = sourceFileText;
        for (let i = 0; i < steps.length; i++) {
            tutorialText = tutorialText.replace(steps[i], '');
        }

        return {
            context: options.context,
            declaration: options.declaration,
            declarationSymbol: options.declarationSymbol,
            sourceFileText: tutorialText,
            steps: steps
        }
    }
    protected processModuleExport (exportSymbol: Symbol): void {
        const followedSymbol: Symbol = UtilTypescriptHelpers.followAliases(exportSymbol, this.typeChecker);

        if (!followedSymbol.declarations) {
            // If we upgrade to a new version of the Typescript compiler that introduces
            // new AST variations that we haven't tested before
            this.reportError(`Definition with no declarations: ${exportSymbol.name}`);
            return;
        }

        for (const declaration of followedSymbol.declarations) {
            const options: IAstItemOptions = {
                context: this.context,
                declaration,
                declarationSymbol: followedSymbol,
                exportSymbol
            }

            if (followedSymbol.flags & (
                SymbolFlags.Class |
                SymbolFlags.Interface |
                SymbolFlags.Function |
                SymbolFlags.Enum
            )) {
                this.addMemberItem(new AstTutorial(AstModule._getTutorialOptions(options)));
            } else {
                this.reportWarning(`Unsupported export: ${exportSymbol.name}`);
            }
        }
    }
    constructor (options: IAstItemOptions) {
        super(options);
    }
}