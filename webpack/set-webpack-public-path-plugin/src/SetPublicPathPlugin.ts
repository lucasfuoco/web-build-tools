// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { EOL } from 'os';
import {
  cloneDeep,
  escapeRegExp
} from 'lodash';
import * as Webpack from 'webpack';
import * as Tapable from 'tapable';

import {
  IV3Compilation,
  IV3Module,
  IV3Chunk
} from './V3Interfaces';
import {
  IInternalOptions,
  getSetPublicPathCode
} from './codeGenerator';

/**
 * The base options for setting the webpack public path at runtime.
 *
 * @public
 */
export interface ISetWebpackPublicPathOptions {
  /**
   * Use the System.baseURL property if it is defined.
   */
  systemJs?: boolean;

  /**
   * Use the specified string as a URL prefix after the SystemJS path or the publicPath option.
   * If neither systemJs nor publicPath is defined, this option will not apply and an exception will be thrown.
   */
  urlPrefix?: string;

  /**
   * Use the specified path as the base public path.
   */
  publicPath?: string;

  /**
   * Check for a variable with this name on the page and use its value as a regular expression against script paths to
   *  the bundle's script. If a value foo is passed into regexVariable, the produced bundle will look for a variable
   *  called foo during initialization, and if a foo variable is found, use its value as a regular expression to detect
   *  the bundle's script.
   *
   * See the README for more information.
   */
  regexVariable?: string;

  /**
   * A function that returns a snippet of code that manipulates the variable with the name that's specified in the
   *  parameter. If this parameter isn't provided, no post-processing code is included. The variable must be modified
   *  in-place - the processed value should not be returned.
   *
   * See the README for more information.
   */
  getPostProcessScript?: (varName: string) => string;

  /**
   * If true, find the last script matching the regexVariable (if it is set). If false, find the first matching script.
   * This can be useful if there are multiple scripts loaded in the DOM that match the regexVariable.
   */
  preferLastFoundScript?: boolean;

  /**
   * If true, always include the public path-setting code. Don't try to detect if any chunks or assets are present.
   */
  skipDetection?: boolean;
}

/**
 * Options for the set-webpack-public-path plugin.
 *
 * @public
 */
export interface ISetWebpackPublicPathPluginOptions extends ISetWebpackPublicPathOptions {
  /**
   * An object that describes how the public path should be discovered.
   */
  scriptName?: {
    /**
     * A regular expression expressed as a string to be applied to all script paths on the page.
     */
    name: string;

    /**
     * If true, the name property is tokenized.
     *
     * See the README for more information.
     */
    isTokenized: boolean;
  };
}

interface IV4MainTemplate extends Webpack.compilation.MainTemplate {
  hooks: {
    startup: Tapable.SyncHook<string, Webpack.compilation.Chunk, string>;
  };
  requireFn: string;
}

interface IV4Chunk extends Webpack.compilation.Chunk {
  forEachModule(callback: (module: Webpack.compilation.Module) => void): void;
}

interface IStartupCodeOptions {
  source: string;
  chunk: IV3Chunk | Webpack.compilation.Chunk;
  hash: string;
  requireFn: string;
}

/**
 * This simple plugin sets the __webpack_public_path__ variable to a value specified in the arguments,
 *  optionally appended to the SystemJs baseURL property.
 *
 * @public
 */
export class SetPublicPathPlugin implements Webpack.Plugin {
  public options: ISetWebpackPublicPathPluginOptions;

  constructor(options: ISetWebpackPublicPathPluginOptions) {
    this.options = options;
  }

  public apply(compiler: Webpack.Compiler): void {
    const isWebpack4: boolean = !!compiler.hooks;

    if (isWebpack4) {
      compiler.hooks.compilation.tap('set-webpack-public-path', (compilation: Webpack.compilation.Compilation) => {
        const v4MainTemplate: IV4MainTemplate = compilation.mainTemplate as IV4MainTemplate;
        v4MainTemplate.hooks.startup.tap(
          'set-webpack-public-path',
          (source: string, chunk: IV4Chunk, hash: string) => {
            let assetOrChunkFound: boolean = !!this.options.skipDetection;

            if (!assetOrChunkFound) {
              for (const chunkGroup of chunk.groupsIterable) {
                const children: Webpack.compilation.Chunk[] = chunkGroup.getChildren();
                assetOrChunkFound = assetOrChunkFound || (children.length > 0);
              }
            }

            if (!assetOrChunkFound) {
              for (const innerModule of chunk.modulesIterable) {
                if (innerModule.buildInfo.assets && Object.keys(innerModule.buildInfo.assets).length > 0) {
                  assetOrChunkFound = true;
                }
              }
            }

            if (assetOrChunkFound) {
              return this._getStartupCode({
                source,
                chunk,
                hash,
                requireFn: v4MainTemplate.requireFn
              });
            } else {
              return source;
            }
          }
        );
      });
    } else {
      compiler.plugin('compilation', (compilation: IV3Compilation, params: Object): void => {
        compilation.mainTemplate.plugin('startup', (source: string, chunk: IV3Chunk, hash: string) => {
          let assetOrChunkFound: boolean = this.options.skipDetection || chunk.chunks.length > 0;
          if (!assetOrChunkFound) {
            chunk.forEachModule((innerModule: IV3Module) => {
              if (innerModule.assets && Object.keys(innerModule.assets).length > 0) {
                assetOrChunkFound = true;
              }
            });
          }

          if (assetOrChunkFound) {
            return this._getStartupCode({
              source,
              chunk,
              hash,
              requireFn: compilation.mainTemplate.requireFn
            });
          } else {
            return source;
          }
        });
      });
    }
  }

  private _getStartupCode(options: IStartupCodeOptions): string {
    const moduleOptions: IInternalOptions = cloneDeep(this.options);

    // If this module has ownership over any chunks or assets, inject the public path code
    moduleOptions.webpackPublicPathVariable = `${options.requireFn}.p`;
    moduleOptions.linePrefix = '  ';

    if (this.options.scriptName) {
      moduleOptions.regexName = this.options.scriptName.name;
      if (this.options.scriptName.isTokenized) {
        moduleOptions.regexName = moduleOptions.regexName
          .replace(/\[name\]/g, escapeRegExp(options.chunk.name))
          .replace(/\[hash\]/g, options.chunk.renderedHash);
      }
    }

    return [
      '// Set the webpack public path',
      '(function () {',
        getSetPublicPathCode(moduleOptions, console.error),
      '})();',
      '',
      options.source
    ].join(EOL);
  }
}
