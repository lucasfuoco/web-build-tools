// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import * as Gulp from 'gulp';
import { EOL } from 'os';

import { GulpTask } from '@microsoft/gulp-core-build';
import { splitStyles } from '@microsoft/load-themed-styles';
import {
  FileSystem,
  JsonFile,
  LegacyAdapters
} from '@microsoft/node-core-library';
import * as glob from 'glob';
import * as nodeSass from 'node-sass';
import * as postcss from 'postcss';
import * as CleanCss from 'clean-css';
import * as autoprefixer from 'autoprefixer';
import * as cssModules from 'postcss-modules';
import * as crypto from 'crypto';

export interface ISassTaskConfig {
  /**
   * An optional parameter for text to include in the generated TypeScript file.
   */
  preamble?: string;

  /**
   * An optional parameter for text to include at the end of the generated TypeScript file.
   */
  postamble?: string;

  /**
   * An array of glob patterns for locating files.
   */
  sassMatch?: string[];

  /**
   * If this option is specified, ALL files will be treated as module.sass or module.scss and will
   * automatically generate a corresponding TypeScript file. All classes will be
   * appended with a hash to help ensure uniqueness on a page. This file can be
   * imported directly, and will contain an object describing the mangled class names.
   */
  useCSSModules?: boolean;

  /**
   * If false, we will set the CSS property naming warning to verbose message while the module generates
   * to prevent task exit with exitcode: 1.
   * Default value is true
   */
  warnOnCssInvalidPropertyName?: boolean;

  /**
   * If true, we will generate a CSS in the lib folder. If false, the CSS is directly embedded
   * into the TypeScript file
   */
  dropCssFiles?: boolean;

  /**
   * If files are matched by sassMatch which do not end in .module.sass or .module.scss, log a warning.
   */
  warnOnNonCSSModules?: boolean;

  /**
   * If this option is specified, module CSS will be exported using the name provided. If an
   * empty value is specified, the styles will be exported using 'export =', rather than a
   * named export. By default we use the 'default' export name.
   */
  moduleExportName?: string;
}

const _classMaps: { [file: string]: Object } = {};

export class SassTask extends GulpTask<ISassTaskConfig> {
  public cleanMatch: string[] = [
    'src/**/*.sass.ts',
    'src/**/*.scss.ts'
  ];

  private _postCSSPlugins: postcss.AcceptedPlugin[] = [
    autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'ie >= 10'] })
  ];

  private _modulePostCssAdditionalPlugins: postcss.AcceptedPlugin[] = [
    cssModules({
      getJSON: this._generateModuleStub.bind(this),
      generateScopedName: this._generateScopedName.bind(this)
    })
  ];

  constructor() {
    super(
      'sass',
      {
        preamble: '/* tslint:disable */',
        postamble: '/* tslint:enable */',
        sassMatch: [
          'src/**/*.scss',
          'src/**/*.sass'
        ],
        useCSSModules: false,
        warnOnCssInvalidPropertyName: true,
        dropCssFiles: false,
        warnOnNonCSSModules: false
      }
    );
  }

  public loadSchema(): Object {
    return JsonFile.load(path.join(__dirname, 'sass.schema.json'));
  }

  public executeTask(gulp: typeof Gulp): Promise<void> | undefined {
    if (!this.taskConfig.sassMatch) {
      return Promise.reject(new Error('taskConfig.sassMatch must be defined'));
    }

    return this._globAll(...this.taskConfig.sassMatch).then((matches: string[]) => {
      return Promise.all(matches.map((match) => this._processFile(match)));
    }).then(() => { /* collapse void[] to void */ });
  }

  private _generateModuleStub(cssFileName: string, json: Object): void {
    _classMaps[cssFileName] = json;
  }

  private _generateScopedName(name: string, fileName: string, css: string): string {
    return name + '_' + crypto.createHmac('sha1', fileName).update(css).digest('hex').substring(0, 8);
  }

  private _processFile(filePath: string): Promise<void> {
    // Ignore files that start with underscores
    if (path.basename(filePath).match(/^\_/)) {
      return Promise.resolve();
    }

    const isFileModuleCss: boolean = !!filePath.match(/\.module\.s(a|c)ss/);
    const processAsModuleCss: boolean = isFileModuleCss || !!this.taskConfig.useCSSModules;

    if (!isFileModuleCss && !this.taskConfig.useCSSModules && this.taskConfig.warnOnNonCSSModules) {
      // If the file doesn't end with .module.scss and we don't treat all files as module-scss, warn
      const relativeFilePath: string = path.relative(this.buildConfig.rootPath, filePath);
      this.logWarning(`${relativeFilePath}: filename should end with module.sass or module.scss`);
    }

    let cssOutputPath: string | undefined = undefined;
    let cssOutputPathAbsolute: string | undefined = undefined;
    if (this.taskConfig.dropCssFiles) {
      const srcRelativePath: string = path.relative(
        path.join(this.buildConfig.rootPath, this.buildConfig.srcFolder),
        filePath
      );
      cssOutputPath = path.join(this.buildConfig.libFolder, srcRelativePath);
      cssOutputPath = cssOutputPath.replace(/\.s(c|a)ss$/, '.css');
      cssOutputPathAbsolute = path.join(this.buildConfig.rootPath, cssOutputPath);
    }

    return LegacyAdapters.convertCallbackToPromise(
      nodeSass.render,
      {
        file: filePath,
        importer: (url: string) => ({ file: this._patchSassUrl(url) }),
        sourceMap: this.taskConfig.dropCssFiles,
        sourceMapContents: true,
        omitSourceMapUrl: true,
        outFile: cssOutputPath
      }
    ).catch((error: nodeSass.SassError) => {
      this.fileError(filePath, error.line, error.column, error.name, error.message);
      throw new Error(error.message);
    }).then((result: nodeSass.Result) => {
      const options: postcss.ProcessOptions = {
        from: filePath
      };
      if (result.map && !this.buildConfig.production) {
        options.map = {
          prev: result.map.toString() // Pass the source map through to postcss
        };
      }

      const plugins: postcss.AcceptedPlugin[] = [
        ...this._postCSSPlugins,
        ...(processAsModuleCss ? this._modulePostCssAdditionalPlugins : [])
      ];
      return postcss(plugins).process(result.css.toString(), options) as PromiseLike<postcss.Result>;
    }).then((result: postcss.Result) => {
      const cleanCssOptions: CleanCss.Options = {
        advanced: false
      };
      if (result.map) {
        cleanCssOptions.sourceMap = result.map.toString(); // Pass the source map through to cleancss
      }

      const cleanCss: CleanCss =  new CleanCss(cleanCssOptions);
      return cleanCss.minify(result.css.toString());
    }).then((result: CleanCss.Output) => {
      if (cssOutputPathAbsolute) {
        const generatedFileLines: string[] = [
          result.styles.toString()
        ];
        if (result.sourceMap && !this.buildConfig.production) {
          const encodedSourceMap: string = Buffer.from(result.sourceMap.toString()).toString('base64');
          generatedFileLines.push(...[
            `/*# sourceMappingURL=data:application/json;base64,${encodedSourceMap} */`
          ]);
        }

        FileSystem.writeFile(cssOutputPathAbsolute, generatedFileLines.join(EOL), { ensureFolderExists: true });
      }

      const scssTsOutputPath: string = `${filePath}.ts`;
      const classNames: Object = _classMaps[filePath];
      let exportClassNames: string = '';
      const content: string | undefined = result.styles;

      if (classNames) {
        const classNamesLines: string[] = [
          'const styles = {'
        ];

        const classKeys: string[] = Object.keys(classNames);
        classKeys.forEach((key: string, index: number) => {
          const value: string = classNames[key];
          let line: string = '';
          if (key.indexOf('-') !== -1) {
            const message: string = `The local CSS class '${key}' is not camelCase and will not be type-safe.`;
            this.taskConfig.warnOnCssInvalidPropertyName ?
              this.logWarning(message) :
              this.logVerbose(message);
            line = `  '${key}': '${value}'`;
          } else {
            line = `  ${key}: '${value}'`;
          }

          if ((index + 1) <= classKeys.length) {
            line += ',';
          }

          classNamesLines.push(line);
        });

        let exportString: string = 'export default styles;';

        if (this.taskConfig.moduleExportName === '') {
          exportString = 'export = styles;';
        } else if (!!this.taskConfig.moduleExportName) {
          // exportString = `export const ${this.taskConfig.moduleExportName} = styles;`;
        }

        classNamesLines.push(
          '};',
          '',
          exportString
        );

        exportClassNames = classNamesLines.join(EOL);
      }

      let lines: string[] = [];

      lines.push(this.taskConfig.preamble || '');

      if (cssOutputPathAbsolute) {
        lines = lines.concat([
          `require(${JSON.stringify(`./${path.basename(cssOutputPathAbsolute)}`)});`,
          exportClassNames
        ]);
      } else if (!!content) {
        lines = lines.concat([
          'import { loadStyles } from \'@microsoft/load-themed-styles\';',
          '',
          exportClassNames,
          '',
          `loadStyles(${JSON.stringify(splitStyles(content))});`
        ]);
      }

      lines.push(this.taskConfig.postamble || '');

      const generatedTsFile: string = (
        lines
          .join(EOL)
          .replace(new RegExp(`(${EOL}){3,}`, 'g'), `${EOL}${EOL}`)
          .replace(new RegExp(`(${EOL})+$`, 'm'), EOL)
      );

      FileSystem.writeFile(scssTsOutputPath, generatedTsFile);
    });
  }

  private _globAll(...patterns: string[]): Promise<string[]> {
    return Promise.all(patterns.map((pattern) =>
      LegacyAdapters.convertCallbackToPromise(
        glob,
        path.isAbsolute(pattern) ? pattern : path.join(this.buildConfig.rootPath, pattern)
      )
    )).then((matchSets: string[][]) => {
      const result: { [path: string]: boolean } = {};
      for (const matchSet of matchSets) {
        for (const match of matchSet) {
          const normalizedMatch: string = path.resolve(match);
          result[normalizedMatch] = true;
        }
      }

      return Object.keys(result);
    });
  }

  private _patchSassUrl(url: string): string {
    if (url[0] === '~') {
      url = 'node_modules/' + url.substr(1);
    } else if (url === 'stdin') {
      url = '';
    }

    return url;
  }
}
