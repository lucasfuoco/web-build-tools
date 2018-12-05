import { JsonFile } from '@microsoft/node-core-library';
import { ReleaseTag } from '../aedoc/release_tag.types';
import { ApiJsonConverter } from '../api/api_json_converter';
import { AstItem } from '../ast/ast_item';
import { AstPackage } from '../ast/ast_package';
import { AstStep } from '../ast/ast_step';
import { AstTutorial } from '../ast/ast_tutorial';
import { ExtractorContext } from '../extractor_context/extractor_context';
import { AstItemVisitor } from './ast_item_visitor';

/**
 * For a library such as "example-package", ApiFileGenerator generates the "example-package.api.json"
 * file which represents the API surface for that package. This file should be published as part
 * of the library's NPM package. Tutorial Extractor will read this file later when it's analysing
 * another project that consumes the library. (Otherwise, Tutorial Extractor would have to re-analyze all
 * this *.ts files, which would be bad because the compiler files might not be available for
 * a published package, or the results of the analysis might be difference somehow.) Documentation
 * tools such as the tutorial-documenter can also use the *.api.json files.
 */
// tslint:disable-next-line:export-name
export class TutorialJsonGenerator extends AstItemVisitor {
    // tslint:disable:no-inferrable-types
    private static _EXPORTS_KEY: string = 'exports';

    protected jsonOutput: Object = {};

    public writeJsonFile (reportFilename: string, context: ExtractorContext): void {
        this.visit(context.package, this.jsonOutput);

        // Write the output before validating the schema, so we can debug it
        JsonFile.save(this.jsonOutput, reportFilename);
    }

    protected visit (astItem: AstItem, refObject?: Object): void {

        switch (astItem.inheritedReleaseTag) {
            case ReleaseTag.None:
            case ReleaseTag.Beta:
            case ReleaseTag.Public:
                break;
            default:
                return; // skip @alpha and @internal definitions
        }

        super.visit(astItem, refObject);
    }

    protected visitAstPackage (astPackage: AstPackage, refObject?: Object): void {
        // tslint:disable:no-string-literal
        refObject!['kind'] = ApiJsonConverter.convertKindToJson(astPackage.kind);
        refObject!['name'] = astPackage.name;
        refObject!['summary'] = astPackage.documentation.summary;
        refObject!['remarks'] = astPackage.documentation.remarks;

        const membersNode: Object = {};
        refObject![TutorialJsonGenerator._EXPORTS_KEY] = membersNode;
        for (const astItem of astPackage.getSortedMemberItems()) {
            this.visit(astItem, membersNode);
        }
    }

    protected visitAstTutorial (astTutorial: AstTutorial, refObject?: Object): void {
        if (!astTutorial.supportedName) {
            return;
        }

        const children: Array<Object> = new Array<Object>();
        const members: AstItem[] = astTutorial.getSortedMemberItems();
        for (let i: number = 0; i < members.length; ++i) {
            this.visit(members[i], children);
        }

        const tutorialNode: Object = {
            kind: ApiJsonConverter.convertKindToJson(astTutorial.kind),
            deprecatedMessage: astTutorial.inheritedDeprecatedMessage || [],
            tutorialName: astTutorial.documentation.tutorialName || [],
            category: astTutorial.documentation.category || [],
            summary: astTutorial.documentation.summary || [],
            remarks: astTutorial.documentation.remarks || [],
            isBeta: astTutorial.inheritedReleaseTag === ReleaseTag.Beta,
            children: children
        };
        refObject![astTutorial.name] = tutorialNode;
    }

    protected visitAstStep (astStep: AstStep, refObject: Array<Object>): void {
        if (!astStep.supportedName) {
            return;
        }
        const stepNode: Object = {
            kind: ApiJsonConverter.convertKindToJson(astStep.kind),
            deprecatedMessage: astStep.inheritedDeprecatedMessage || [],
            stepName: astStep.documentation.stepName || [],
            summary: astStep.documentation.summary || [],
            remarks: astStep.documentation.remarks || [],
            code: astStep.documentation.code || [],
            codeDescription: astStep.documentation.codeDescription || []
        };
        refObject.push(stepNode);
    }
}