// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as colors from 'colors';
import * as semver from 'semver';

import { RushConfiguration } from '../api/RushConfiguration';
import { InstallManager, IInstallManagerOptions } from './InstallManager';
import { RushConfigurationProject } from '../api/RushConfigurationProject';
import { VersionMismatchFinder } from '../api/VersionMismatchFinder';
import { PurgeManager } from './PurgeManager';
import { Utilities } from '../utilities/Utilities';
import { DependencyType, PackageJsonEditor, PackageJsonDependency } from '../api/PackageJsonEditor';
import { RushGlobalFolder } from '../api/RushGlobalFolder';

/**
 * The type of SemVer range specifier that is prepended to the version
 */
export const enum SemVerStyle {
  Exact = 'exact',
  Caret = 'caret',
  Tilde = 'tilde'
}

/**
 * Options for adding a dependency to a particular project.
 */
export interface IPackageJsonUpdaterRushAddOptions {
  /**
   * The project whose package.json should get updated
   */
  currentProject: RushConfigurationProject;
  /**
   * The name of the dependency to be added
   */
  packageName: string;
  /**
   * The initial version specifier.
   * If undefined, the latest version will be used (that doesn't break ensureConsistentVersions).
   * If specified, the latest version meeting the SemVer specifier will be used as the basis.
   */
  initialVersion: string | undefined;
  /**
   * Whether or not this dependency should be added as a devDependency or a regular dependency.
   */
  devDependency: boolean;
  /**
   * If specified, other packages that use this dependency will also have their package.json's updated.
   */
  updateOtherPackages: boolean;
  /**
   * If specified, "rush update" will not be run after updating the package.json file(s).
   */
  skipUpdate: boolean;
  /**
   * If specified, "rush update" will be run in debug mode.
   */
  debugInstall: boolean;
  /**
   * The style of range that should be used if the version is automatically detected.
   */
  rangeStyle: SemVerStyle;
  /**
   * The variant to consider when performing installations and validating shrinkwrap updates.
   */
  variant?: string | undefined;
}

/**
 * Configuration options for adding or updating a dependency in a single project
 */
export interface IUpdateProjectOptions {
  /**
   * The project which will have its package.json updated
   */
  project: RushConfigurationProject;
  /**
   * The name of the dependency to be added or updated in the project
   */
  packageName: string;
  /**
   * The new SemVer specifier that should be added to the project's package.json
   */
  newVersion: string;
  /**
   * The type of dependency that should be updated. If left empty, this will be auto-detected.
   * If it cannot be auto-detected an exception will be thrown.
   */
  dependencyType?: DependencyType;
}

/**
 * A helper class for managing the dependencies of various package.json files.
 * @internal
 */
export class PackageJsonUpdater {
  private _rushConfiguration: RushConfiguration;
  private _rushGlobalFolder: RushGlobalFolder;

  public constructor(rushConfiguration: RushConfiguration, rushGlobalFolder: RushGlobalFolder) {
    this._rushConfiguration = rushConfiguration;
    this._rushGlobalFolder = rushGlobalFolder;
  }

  /**
   * Adds a dependency to a particular project. The core business logic for "rush add".
   */
  public doRushAdd(options: IPackageJsonUpdaterRushAddOptions): Promise<void> {
    const {
      currentProject,
      packageName,
      initialVersion,
      devDependency,
      updateOtherPackages,
      skipUpdate,
      debugInstall,
      rangeStyle,
      variant
    } = options;

    const implicitlyPinned: Map<string, string>
      = InstallManager.collectImplicitlyPreferredVersions(this._rushConfiguration, {
        variant
      });

    const version: string = this._getNormalizedVersionSpec(
      packageName, initialVersion, implicitlyPinned.get(packageName), rangeStyle);

    console.log();
    console.log(colors.green(`Updating projects to use `)
      + packageName + '@' + colors.cyan(version));
    console.log();

    const currentProjectUpdate: IUpdateProjectOptions = {
      project: currentProject,
      packageName,
      newVersion: version,
      dependencyType: devDependency ? DependencyType.Dev : undefined
    };
    this.updateProject(currentProjectUpdate);

    const otherPackageUpdates: Array<IUpdateProjectOptions> = [];

    if (this._rushConfiguration.ensureConsistentVersions || updateOtherPackages) {
      // we need to do a mismatch check
      const mismatchFinder: VersionMismatchFinder = VersionMismatchFinder.getMismatches(this._rushConfiguration, {
        variant: variant
      });

      const mismatches: Array<string> = mismatchFinder.getMismatches();
      if (mismatches.length) {
        if (!updateOtherPackages) {
          return Promise.reject(new Error(`Adding '${packageName}@${version}' to ${currentProject.packageName}`
            + ` causes mismatched dependencies. Use the "--make-consistent" flag to update other packages to use this`
            + ` version, or do not specify a SemVer range.`));
        }

        // otherwise we need to go update a bunch of other projects
        const mismatchedVersions: Array<string> | undefined = mismatchFinder.getVersionsOfMismatch(packageName);
        if (mismatchedVersions) {
          for (const mismatchedVersion of mismatchedVersions) {
            for (const consumer of mismatchFinder.getConsumersOfMismatch(packageName, mismatchedVersion)!) {
              if (consumer !== currentProject.packageName) {
                otherPackageUpdates.push({
                  project: this._rushConfiguration.getProjectByName(consumer)!,
                  packageName: packageName,
                  newVersion: version
                });
              }
            }
          }
        }
      }
    }

    this.updateProjects(otherPackageUpdates);

    for (const project of this._rushConfiguration.projects) {
      if (project.packageJsonEditor.saveIfModified()) {
        console.log(colors.green('Wrote ') + project.packageJsonEditor.filePath);
      }
    }

    if (skipUpdate) {
      return Promise.resolve();
    }

    const purgeManager: PurgeManager = new PurgeManager(this._rushConfiguration, this._rushGlobalFolder);
    const installManagerOptions: IInstallManagerOptions = {
      debug: debugInstall,
      allowShrinkwrapUpdates: true,
      bypassPolicy: false,
      noLink: false,
      fullUpgrade: false,
      recheckShrinkwrap: false,
      networkConcurrency: undefined,
      collectLogFile: false,
      variant: variant
    };
    const installManager: InstallManager = new InstallManager(
      this._rushConfiguration,
      this._rushGlobalFolder,
      purgeManager,
      installManagerOptions
    );

    console.log();
    console.log(colors.green('Running "rush update"'));
    console.log();
    return installManager.doInstall()
      .then(() => {
        purgeManager.deleteAll();
      })
      .catch((error) => {
        purgeManager.deleteAll();
        throw error;
      });
  }

  /**
   * Updates several projects' package.json files
   */
  public updateProjects(projectUpdates: Array<IUpdateProjectOptions>): void {
    for (const update of projectUpdates) {
      this.updateProject(update);
    }
  }

  /**
   * Updates a single project's package.json file
   */
  public updateProject(options: IUpdateProjectOptions): void {
    let { dependencyType } = options;
    const {
      project,
      packageName,
      newVersion
    } = options;
    const packageJson: PackageJsonEditor = project.packageJsonEditor;

    const oldDependency: PackageJsonDependency | undefined = packageJson.tryGetDependency(packageName);
    const oldDevDependency: PackageJsonDependency | undefined = packageJson.tryGetDevDependency(packageName);

    const oldDependencyType: DependencyType | undefined =
      oldDevDependency ? oldDevDependency.dependencyType :
        oldDependency ? oldDependency.dependencyType : undefined;

    dependencyType = dependencyType || oldDependencyType || DependencyType.Regular;

    packageJson.addOrUpdateDependency(packageName, newVersion, dependencyType!);
  }

  /**
   * Selects an appropriate version number for a particular package, given an optional initial SemVer spec.
   * If ensureConsistentVersions, tries to pick a version that will be consistent.
   * Otherwise, will choose the latest semver matching the initialSpec and append the proper range style.
   * @param packageName - the name of the package to be used
   * @param initialSpec - a semver pattern that should be used to find the latest version matching the spec
   * @param implicitlyPinnedVersion - the implicityly preferred (aka common/primary) version of the package in use
   * @param rangeStyle - if this version is selected by querying registry, then this range specifier is prepended to
   *   the selected version.
   */
  private _getNormalizedVersionSpec(
    packageName: string,
    initialSpec: string | undefined,
    implicitlyPinnedVersion: string | undefined,
    rangeStyle: SemVerStyle): string {

    console.log(colors.gray(`Determining new version for dependency: ${packageName}`));
    if (initialSpec) {
      console.log(`Specified version selector: ${colors.cyan(initialSpec)}`);
    } else {
      console.log(`No version selector was specified, so the version will be determined automatically.`);
    }
    console.log();

    // if ensureConsistentVersions => reuse the pinned version
    // else, query the registry and use the latest that satisfies semver spec
    if (initialSpec && implicitlyPinnedVersion && initialSpec === implicitlyPinnedVersion) {
      console.log(colors.green('Assigning "')
        + colors.cyan(initialSpec)
        + colors.green(`" for "${packageName}" because it matches what other projects are using in this repo.`));
      return initialSpec;
    }

    if (this._rushConfiguration.ensureConsistentVersions && !initialSpec && implicitlyPinnedVersion) {
      console.log(`Assigning the version range "${colors.cyan(implicitlyPinnedVersion)}" for "${packageName}" because`
        + ` it is already used by other projects in this repo.`);
      return implicitlyPinnedVersion;
    }

    let selectedVersion: string | undefined;

    if (this._rushConfiguration.packageManager === 'yarn') {
      throw new Error('The Yarn package manager is not currently supported by the "rush add" command.');
    }

    if (initialSpec && initialSpec !== 'latest') {
      console.log(colors.gray('Finding newest version that satisfies the selector: ') + initialSpec);
      console.log();
      console.log(`Querying registry for all versions of "${packageName}"...`);

      const allVersions: string =
        Utilities.executeCommandAndCaptureOutput(this._rushConfiguration.packageManagerToolFilename,
          ['view', packageName, 'versions', '--json'],
          this._rushConfiguration.commonTempFolder);

      let versionList: Array<string> = JSON.parse(allVersions);
      versionList = versionList.sort((a: string, b: string) => { return semver.gt(a, b) ? -1 : 1; });

      console.log(colors.gray(`Found ${versionList.length} available versions.`));

      for (const version of versionList) {
        if (semver.satisfies(version, initialSpec)) {
          selectedVersion = version;
          console.log(`Found latest version: ${colors.cyan(selectedVersion)}`);
          break;
        }
      }
      if (!selectedVersion) {
        throw new Error(`Unable to find a version of "${packageName}" that satisfies`
          + ` the version range "${initialSpec}"`);
      }
    } else {
      if (initialSpec !== 'latest') {
        console.log(colors.gray(`The "ensureConsistentVersions" policy is NOT active,`
          + ` so we will assign the latest version.`));
        console.log();
      }
      console.log(`Querying NPM registry for latest version of "${packageName}"...`);

      selectedVersion = Utilities.executeCommandAndCaptureOutput(this._rushConfiguration.packageManagerToolFilename,
        ['view', `${packageName}@latest`, 'version'],
        this._rushConfiguration.commonTempFolder).trim();
      console.log();

      console.log(`Found latest version: ${colors.cyan(selectedVersion)}`);
    }

    console.log();

    if (rangeStyle === SemVerStyle.Caret) {
      console.log(colors.grey(`Assigning version "^${selectedVersion}" for "${packageName}" because the "--caret"`
        + ` flag was specified.`));
      return '^' + selectedVersion;
    } else if (rangeStyle === SemVerStyle.Exact) {
      console.log(colors.grey(`Assigning version "${selectedVersion}" for "${packageName}" because the "--exact"`
        + ` flag was specified.`));
      return selectedVersion;
    } else {
      console.log(colors.gray(`Assigning version "~${selectedVersion}" for "${packageName}".`));
      return '~' + selectedVersion!;
    }
  }
}
