import * as os from 'os';

import {
  JsonFile,
  FileSystem
} from '@microsoft/node-core-library';

import {
  BaseShrinkwrapFile
} from '../base/BaseShrinkwrapFile';

interface INpmShrinkwrapDependencyJson {
  version: string;
  from: string;
  resolved: string;
  dependencies: { [dependency: string]: INpmShrinkwrapDependencyJson };
}

interface INpmShrinkwrapJson {
  name: string;
  version: string;
  dependencies: { [dependency: string]: INpmShrinkwrapDependencyJson };
}

export class NpmShrinkwrapFile extends BaseShrinkwrapFile {
  private _shrinkwrapJson: INpmShrinkwrapJson;

  public static loadFromFile(shrinkwrapJsonFilename: string): NpmShrinkwrapFile | undefined {
    let data: string | undefined = undefined;
    try {
      if (!FileSystem.exists(shrinkwrapJsonFilename)) {
        return undefined; // file does not exist
      }

      // We don't use JsonFile/jju here because shrinkwrap.json is a special NPM file format
      // and typically very large, so we want to load it the same way that NPM does.
      data = FileSystem.readFile(shrinkwrapJsonFilename);
      if (data.charCodeAt(0) === 0xFEFF) {  // strip BOM
        data = data.slice(1);
      }

      return new NpmShrinkwrapFile(JSON.parse(data));
    } catch (error) {
      throw new Error(`Error reading "${shrinkwrapJsonFilename}":` + os.EOL + `  ${error.message}`);
    }
  }

  public getTempProjectNames(): ReadonlyArray<string> {
    return this._getTempProjectNames(this._shrinkwrapJson.dependencies);
  }

  protected serialize(): string {
    return JsonFile.stringify(this._shrinkwrapJson);
  }

  protected getTopLevelDependencyVersion(dependencyName: string): string | undefined {
     // First, check under tempProjectName, as this is the first place "rush link" looks.
    const dependencyJson: INpmShrinkwrapDependencyJson | undefined =
      NpmShrinkwrapFile.tryGetValue(this._shrinkwrapJson.dependencies, dependencyName);

     if (!dependencyJson) {
       return undefined;
     }

     return dependencyJson.version;
  }

  /**
   * @param dependencyName the name of the dependency to get a version for
   * @param tempProjectName the name of the temp project to check for this dependency
   * @param versionRange Not used, just exists to satisfy abstract API contract
   */
  protected tryEnsureDependencyVersion(dependencyName: string,
    tempProjectName: string,
    versionRange: string): string | undefined {

    // First, check under tempProjectName, as this is the first place "rush link" looks.
    let dependencyJson: INpmShrinkwrapDependencyJson | undefined = undefined;

    const tempDependency: INpmShrinkwrapDependencyJson | undefined = NpmShrinkwrapFile.tryGetValue(
      this._shrinkwrapJson.dependencies, tempProjectName);
    if (tempDependency && tempDependency.dependencies) {
      dependencyJson = NpmShrinkwrapFile.tryGetValue(tempDependency.dependencies, dependencyName);
    }

    // Otherwise look at the root of the shrinkwrap file
    if (!dependencyJson) {
      return this.getTopLevelDependencyVersion(dependencyName);
    }

    return dependencyJson.version;
  }

  private constructor(shrinkwrapJson: INpmShrinkwrapJson) {
    super();
    this._shrinkwrapJson = shrinkwrapJson;

    // Normalize the data
    if (!this._shrinkwrapJson.version) {
      this._shrinkwrapJson.version = '';
    }
    if (!this._shrinkwrapJson.name) {
      this._shrinkwrapJson.name = '';
    }
    if (!this._shrinkwrapJson.dependencies) {
      this._shrinkwrapJson.dependencies = { };
    }
  }
}