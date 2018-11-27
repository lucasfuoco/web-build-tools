import {IAstItemOptions} from './ast_item.types';

export interface IAstTutorialOptions extends IAstItemOptions {
    /** A list of steps to process as individual abstract syntax tree items. */
    steps: string[];
}