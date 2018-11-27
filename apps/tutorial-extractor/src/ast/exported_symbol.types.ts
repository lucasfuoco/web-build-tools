import { Symbol } from 'typescript';

export interface IExportedSymbol {
    exportedName: string;
    followedSymbol: Symbol;
}