import { SourceFile, Symbol } from 'typescript';
import { ExtractorContext } from '../extractor_context/index';
import { UtilTypescriptHelpers } from '../utils/util_typescript_helpers';
import { AstItemKind } from './ast_item.types';
import { IAstItemOptions } from './ast_item.types';
import { AstModule } from './ast_module';
import { IExportedSymbol } from './exported_symbol.types';

// tslint:disable-next-line:export-name
export class AstPackage extends AstModule {
    private _exportedNormalizedSymbols: IExportedSymbol[] = [];
    private static _getOptions (context: ExtractorContext, rootFile: SourceFile): IAstItemOptions {
        const rootFileSymbol: Symbol | undefined = UtilTypescriptHelpers.getSymbolForDeclaration(rootFile);
        if (!rootFileSymbol || !rootFileSymbol.declarations) {
            throw new Error('Unable to find a root declaration for this package.');
        }
        return {
            context,
            declaration: rootFileSymbol.declarations[0],
            declarationSymbol: rootFileSymbol
        };
    }
    constructor (context: ExtractorContext, rootFile: SourceFile) {
        super(AstPackage._getOptions(context, rootFile));
        this.kind = AstItemKind.Package;
        this.name = context.packageName;

        const exportSymbols: Symbol[] = this.typeChecker.getExportsOfModule(this.declarationSymbol) || [];
        for (const exportSymbol of exportSymbols) {
            this.processModuleExport(exportSymbol);
            const followedSymbol: Symbol = UtilTypescriptHelpers.followAliases(exportSymbol, this.typeChecker);
            this._exportedNormalizedSymbols.push({
                exportedName: exportSymbol.name,
                followedSymbol: followedSymbol
            });
        }
    }
}