import * as fsx from 'fs-extra';
import * as yaml from 'js-yaml';
import * as os from 'os';
import * as semver from 'semver';

import Utilities from '../../../utilities/Utilities';
import { BaseShrinkwrapFile } from '../base/BaseShrinkwrapFile';

interface IShrinkwrapDependencyJson {
  /** Information about the resolved package */
  resolution: {
    /** The hash of the tarball, to ensure archive integrity */
    integrity: string;
    /** The name of the tarball, if this was from a TGX file */
    tarball?: string;
  };
  /** The list of dependencies and the resolved version */
  dependencies: { [dependency: string]: string };
}

/**
 * This interface represents the raw shrinkwrap.YAML file
 * Example:
 *  {
 *    "dependencies": {
 *      "@rush-temp/project1": "file:./projects/project1.tgz"
 *    },
 *    "packages": {
 *      "file:projects/library1.tgz": {
 *        "dependencies: {
 *          "markdown": "0.5.0"
 *        },
 *        "name": "@rush-temp/library1",
 *        "resolution": {
 *          "tarball": "file:projects/library1.tgz"
 *        },
 *        "version": "0.0.0"
 *      },
 *      "markdown/0.5.0": {
 *        "resolution": {
 *          "integrity": "sha1-KCBbVlqK51kt4gdGPWY33BgnIrI="
 *        }
 *      }
 *    },
 *    "registry": "http://localhost:4873/",
 *    "shrinkwrapVersion": 3,
 *    "specifiers": {
 *      "@rush-temp/project1": "file:./projects/project1.tgz"
 *    }
 *  }
 */
interface IShrinkwrapYaml {
  /** The list of resolved version numbers for direct dependencies */
  dependencies: { [dependency: string]: string };
  /** The description of the solved graph */
  packages: { [dependencyVersion: string]: IShrinkwrapDependencyJson };
  /** URL of the registry which was used */
  registry: string;
  /** The list of specifiers used to resolve direct dependency versions */
  specifiers: { [dependency: string]: string };
}

export function extractVersionFromPnpmVersionSpecifier(version: string): string | undefined {
  let extractedVersion: string | undefined = undefined;

  if (!version) {
    return undefined;
  }

  const versionParts: string[] = version.split('/');

  // it had no slashes, so we know it is a version like "0.0.5"
  if (versionParts.length === 1) {
    extractedVersion = version; // e.g. "0.0.5"
  } else {
    const isScoped: boolean = versionParts[1].indexOf('@') === 0;

    // e.g. "/gulp-karma/0.0.5/karma@0.13.22"
    // if it has 4 parts, then it should be unscoped
    if (versionParts.length === 4 && !isScoped) {
      extractedVersion = versionParts[2]; // e.g. "0.0.5"
    }

    // e.g. "/@ms/sp-client-utilities/3.1.1/foo@13.1.0"
    // if it has 5 parts, it should be scoped
    if (versionParts.length === 5 && isScoped) {
      extractedVersion = versionParts[3]; // e.g. "3.1.1"
    }
  }

  return extractedVersion;
}

export class PnpmShrinkwrapFile extends BaseShrinkwrapFile {
  private _shrinkwrapJson: IShrinkwrapYaml;

  public static loadFromFile(shrinkwrapYamlFilename: string): PnpmShrinkwrapFile | undefined {
    try {
      if (!fsx.existsSync(shrinkwrapYamlFilename)) {
        return undefined; // file does not exist
      }

      // We don't use JsonFile/jju here because shrinkwrap.json is a special NPM file format
      // and typically very large, so we want to load it the same way that NPM does.
      const parsedData: IShrinkwrapYaml = yaml.safeLoad(fsx.readFileSync(shrinkwrapYamlFilename).toString());

      return new PnpmShrinkwrapFile(parsedData);
    } catch (error) {
      throw new Error(`Error reading "${shrinkwrapYamlFilename}":` + os.EOL + `  ${error.message}`);
    }
  }

  public getTempProjectNames(): ReadonlyArray<string> {
    return this._getTempProjectNames(this._shrinkwrapJson.dependencies);
  }

  /**
   * Serializes the PNPM Shrinkwrap file
   */
  protected serialize(): string {
    return yaml.safeDump(this._shrinkwrapJson, {
      sortKeys: true
    });
  }

  /**
   * Gets the version number from the list of top-level dependencies in the "dependencies" section
   * of the shrinkwrap file
   */
  protected getTopLevelDependencyVersion(dependencyName: string): string | undefined {
    return BaseShrinkwrapFile.tryGetValue(this._shrinkwrapJson.dependencies, dependencyName);
  }

  /**
   * Gets the resolved version number of a dependency for a specific temp project.
   * For PNPM, we can reuse the version that another project is using.
   * Note that this function modifies the shrinkwrap data.
   */
  protected tryEnsureDependencyVersion(dependencyName: string,
    tempProjectName: string,
    versionRange: string): string | undefined {
    // PNPM doesn't have the same advantage of NPM, where we can skip generate as long as the
    // shrinkwrap file puts our dependency in either the top of the node_modules folder
    // or underneath the package we are looking at.
    // This is because the PNPM shrinkwrap file describes the exact links that need to be created
    // to recreate the graph..
    // Because of this, we actually need to check for a version that this package is directly
    // linked to.

    const tempProjectDependencyKey: string = this._getTempProjectKey(tempProjectName);
    const packageDescription: IShrinkwrapDependencyJson | undefined =
      this._getPackageDescription(tempProjectDependencyKey);
    if (!packageDescription) {
      return undefined;
    }

    if (!packageDescription.dependencies.hasOwnProperty(dependencyName)) {
      if (versionRange) {
        // this means the current temp project doesn't provide this dependency,
        // however, we may be able to use a different version. we prefer the latest version
        let latestVersion: string | undefined = undefined;

        this.getTempProjectNames().forEach((otherTempProject: string) => {
          const otherVersion: string | undefined = this._getDependencyVersion(dependencyName, otherTempProject);
          if (otherVersion && semver.satisfies(otherVersion, versionRange)) {
            if (!latestVersion || semver.gt(otherVersion, latestVersion)) {
              latestVersion = otherVersion;
            }
          }
        });

        if (latestVersion) {
          // go ahead and fixup the shrinkwrap file to point at this
          const dependencies: { [key: string]: string } | undefined =
            this._shrinkwrapJson.packages[tempProjectDependencyKey].dependencies || {};
          dependencies[dependencyName] = latestVersion;
          this._shrinkwrapJson.packages[tempProjectDependencyKey].dependencies = dependencies;

          return latestVersion;
        }
      }

      return undefined;
    }

    return this._normalizeDependencyVersion(dependencyName, packageDescription.dependencies[dependencyName]);
  }

  private constructor(shrinkwrapJson: IShrinkwrapYaml) {
    super();
    this._shrinkwrapJson = shrinkwrapJson;

    // Normalize the data
    if (!this._shrinkwrapJson.registry) {
      this._shrinkwrapJson.registry = '';
    }
    if (!this._shrinkwrapJson.dependencies) {
      this._shrinkwrapJson.dependencies = { };
    }
    if (!this._shrinkwrapJson.specifiers) {
      this._shrinkwrapJson.specifiers = { };
    }
    if (!this._shrinkwrapJson.packages) {
      this._shrinkwrapJson.packages = { };
    }
  }

  /**
   * Returns the version of a dependency being used by a given project
   */
  private _getDependencyVersion(dependencyName: string, tempProjectName: string): string | undefined {
    const tempProjectDependencyKey: string = this._getTempProjectKey(tempProjectName);
    const packageDescription: IShrinkwrapDependencyJson | undefined =
      this._getPackageDescription(tempProjectDependencyKey);
    if (!packageDescription) {
      return undefined;
    }

    if (!packageDescription.dependencies.hasOwnProperty(dependencyName)) {
      return undefined;
    }

    return this._normalizeDependencyVersion(dependencyName, packageDescription.dependencies[dependencyName]);
  }

  /**
   * Gets the package description for a tempProject from the shrinkwrap file.
   */
  private _getPackageDescription(tempProjectDependencyKey: string): IShrinkwrapDependencyJson | undefined {
    const packageDescription: IShrinkwrapDependencyJson | undefined
      = BaseShrinkwrapFile.tryGetValue(this._shrinkwrapJson.packages, tempProjectDependencyKey);

    if (!packageDescription || !packageDescription.dependencies) {
      return undefined;
    }

    return packageDescription;
  }

  private _getTempProjectKey(tempProjectName: string): string {
    // Example: "project1"
    const unscopedTempProjectName: string = Utilities.parseScopedPackageName(tempProjectName).name;
    return `file:projects/${unscopedTempProjectName}.tgz`;
  }

  private _normalizeDependencyVersion(dependencyName: string, version: string): string | undefined {
    // version will be either:
    // A - the version (e.g. "0.0.5")
    // B - a peer dep version (e.g. "/gulp-karma/0.0.5/karma@0.13.22"
    //                           or "/@ms/sp-client-utilities/3.1.1/foo@13.1.0"
    //                           or "/sinon-chai/2.8.0/chai@3.5.0+sinon@1.17.7")

    // check to see if this is the special style of specifiers
    // e.g.:  "/gulp-karma/0.0.5/karma@0.13.22" or
    //     or "/@ms/sp-client-utilities/3.1.1/foo@13.1.0"
    // split it by forward slashes, then grab the second group (or the 3rd, if the package name is scoped)
    // if the second group doesn't exist, return the version directly
    if (version) {
      const extractedVersion: string | undefined = extractVersionFromPnpmVersionSpecifier(version);

      if (!extractedVersion) {
        throw new Error(`Cannot parse pnpm shrinkwrap version specifier: `
          + `"${version}" for "${dependencyName}"`);
      }

      return extractedVersion;
    } else {
      return undefined;
    }
  }
}