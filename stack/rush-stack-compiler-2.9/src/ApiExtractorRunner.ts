// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ITerminalProvider } from '@microsoft/node-core-library';
import {
  Extractor,
  IExtractorOptions,
  IExtractorConfig
} from '@microsoft/api-extractor';

import { RushStackCompilerBase } from './RushStackCompilerBase';
import { ToolPaths } from './ToolPaths';

/**
 * The ApiExtractorTask uses the api-extractor tool to analyze a project for public APIs. api-extractor will detect
 * common problems and generate a report of the exported public API. The task uses the entry point of a project to
 * find the aliased exports of the project. An api-extractor.ts file is generated for the project in the temp folder.
 * @beta
 */
export class ApiExtractorRunner extends RushStackCompilerBase {
  private _extractorConfig: IExtractorConfig;
  private _extractorOptions: IExtractorOptions;

  constructor(
    extractorConfig: IExtractorConfig,
    extractorOptions: IExtractorOptions,
    rootPath: string,
    terminalProvider: ITerminalProvider
  ) {
    super({}, rootPath, terminalProvider);

    this._extractorConfig = extractorConfig;
    this._extractorOptions = extractorOptions;
  }

  public invoke(): Promise<void> {
    try {
      const extractorOptions: IExtractorOptions = {
        ...this._extractorOptions,
        customLogger: {
          logVerbose: this._terminal.writeVerboseLine.bind(this._terminal),
          logInfo: this._terminal.writeLine.bind(this._terminal),
          logWarning: this._terminal.writeWarningLine.bind(this._terminal),
          logError: this._terminal.writeErrorLine.bind(this._terminal)
        },
        typescriptCompilerFolder: ToolPaths.typescriptPackagePath
      };

      const extractor: Extractor = new Extractor(this._extractorConfig, extractorOptions);

      // NOTE: processProject() returns false if errors or warnings occurred, however we
      // already handle this above via our customLogger
      extractor.processProject();

      return Promise.resolve();
    } catch (e) {
      return Promise.reject(e);
    }
  }
}
