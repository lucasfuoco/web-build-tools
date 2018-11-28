import { AstItem } from '../ast/ast_item';
import { AstPackage } from '../ast/ast_package';
import { AstStep } from '../ast/ast_step';
import { AstTutorial } from '../ast/ast_tutorial';

/**
 * This is a helper class that provides a standard way to walk the AstItem
 * abstract syntax tree.
 */
// tslint:disable-next-line:export-name
export abstract class AstItemVisitor {
    protected visit (astItem: AstItem, refObject?: Object, index?: number): void {
        if (astItem instanceof AstPackage) {
            this.visitAstPackage(astItem as AstPackage, refObject);
        } else if (astItem instanceof AstTutorial) {
            this.visitAstTutorial(astItem as AstTutorial, refObject);
        } else if (astItem instanceof AstStep) {
            this.visitAstStep(astItem as AstStep, refObject, index);
        } else {
            throw new Error('Not implemented');
        }
    }

    protected abstract visitAstPackage (astPackage: AstPackage, refObject?: Object): void;
    protected abstract visitAstTutorial (astTutorial: AstTutorial, refObject?: Object): void;
    protected abstract visitAstStep (astStep: AstStep, refObject?: Object, index?: number): void;
}