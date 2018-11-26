// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

/* tslint:disable:no-constant-condition */

import * as path from 'path';
import { JsonFile } from './JsonFile';
import { IPackageJson } from './IPackageJson';
import { FileConstants } from './Constants';
import { FileSystem } from './FileSystem';

/**
 * Constructor parameters for {@link PackageJsonLookup}
 *
 * @public
 */
export interface IPackageJsonLookupParameters {
  /**
   * Certain package.json fields such as "contributors" can be very large, and may
   * significantly increase the memory footprint for the PackageJsonLookup cache.
   * By default, PackageJsonLookup only loads a subset of standard commonly used
   * fields names.  Set loadExtraFields=true to always return all fields.
   */
  loadExtraFields?: boolean;
}

/**
 * This class provides methods for finding the nearest "package.json" for a folder
 * and retrieving the name of the package.  The results are cached.
 *
 * @public
 */
export class PackageJsonLookup {
  private _loadExtraFields: boolean = false;

  // Cached the return values for tryGetPackageFolder():
  // sourceFilePath --> packageJsonFolder
  private _packageFolderCache: Map<string, string | undefined>;

  // Cached the return values for getPackageName():
  // packageJsonPath --> packageName
  private _packageJsonCache: Map<string, IPackageJson>;

  constructor(parameters?: IPackageJsonLookupParameters) {
    if (parameters) {
      if (parameters.loadExtraFields) {
        this._loadExtraFields = parameters.loadExtraFields;
      }
    }
    this.clearCache();
  }

  /**
   * Clears the internal file cache.
   * @remarks
   * Call this method if changes have been made to the package.json files on disk.
   */
  public clearCache(): void {
    this._packageFolderCache = new Map<string, string | undefined>();
    this._packageJsonCache = new Map<string, IPackageJson>();
  }

  /**
   * Returns the absolute path of a folder containing a package.json file, by looking
   * upwards from the specified fileOrFolderPath.  If no package.json can be found,
   * undefined is returned.
   *
   * @remarks
   * The fileOrFolderPath is not required to actually exist on disk.
   * The fileOrFolderPath itself can be the return value, if it is a folder containing
   * a package.json file.
   * Both positive and negative lookup results are cached.
   *
   * @param fileOrFolderPath - a relative or absolute path to a source file or folder
   * that may be part of a package
   * @returns an absolute path to a folder containing a package.json file
   */
  public tryGetPackageFolderFor(fileOrFolderPath: string): string | undefined {
    // Convert it to an absolute path
    const resolvedFileOrFolderPath: string = path.resolve(fileOrFolderPath);

    // Optimistically hope that the starting string is already in the cache,
    // in which case we can avoid disk access entirely.
    //
    // (Two lookups are required, because get() cannot distinguish the undefined value
    // versus a missing key.)
    if (this._packageFolderCache.has(resolvedFileOrFolderPath)) {
      return this._packageFolderCache.get(resolvedFileOrFolderPath);
    }

    // Now call the recursive part of the algorithm
    return this._tryGetPackageFolderFor(resolvedFileOrFolderPath);
  }

  /**
   * If the specified file or folder is part of a package, this returns the absolute path
   * to the associated package.json file.
   *
   * @remarks
   * The package folder is determined using the same algorithm
   * as {@link PackageJsonLookup.tryGetPackageFolderFor}.
   *
   * @param fileOrFolderPath - a relative or absolute path to a source file or folder
   * that may be part of a package
   * @returns an absolute path to * package.json file
   */
  public tryGetPackageJsonFilePathFor(fileOrFolderPath: string): string | undefined {
    const packageJsonFolder: string | undefined = this.tryGetPackageFolderFor(fileOrFolderPath);
    if (!packageJsonFolder) {
      return undefined;
    }
    return path.join(packageJsonFolder, FileConstants.PackageJson);
  }

  /**
   * If the specified file or folder is part of a package, this loads and returns the
   * associated package.json file.
   *
   * @remarks
   * The package folder is determined using the same algorithm
   * as {@link PackageJsonLookup.tryGetPackageFolderFor}.
   *
   * @param fileOrFolderPath - a relative or absolute path to a source file or folder
   * that may be part of a package
   * @returns an IPackageJson object, or undefined if the fileOrFolderPath does not
   * belong to a package
   */
  public tryLoadPackageJsonFor(fileOrFolderPath: string): IPackageJson | undefined {
    const packageJsonFilePath: string | undefined = this.tryGetPackageJsonFilePathFor(fileOrFolderPath);
    if (!packageJsonFilePath) {
      return undefined;
    }
    return this.loadPackageJson(packageJsonFilePath);
  }

  /**
   * Loads the specified package.json file, if it is not already present in the cache.
   *
   * @remarks
   * Unless {@link IPackageJsonLookupParameters.loadExtraFields} was specified,
   * the returned IPackageJson object will contain a subset of essential fields.
   * The returned object should be considered to be immutable; the caller must never
   * modify it.
   *
   * @param jsonFilename - a relative or absolute path to a package.json file
   */
  public loadPackageJson(jsonFilename: string): IPackageJson {
    if (!FileSystem.exists(jsonFilename)) {
      throw new Error(`Input file not found: ${jsonFilename}`);
    }

    // Since this will be a cache key, follow any symlinks and get an absolute path
    // to minimize duplication.  (Note that duplication can still occur due to e.g. character case.)
    const normalizedFilePath: string = FileSystem.getRealPath(jsonFilename);

    let packageJson: IPackageJson | undefined = this._packageJsonCache.get(normalizedFilePath);

    if (!packageJson) {
      const loadedPackageJson: IPackageJson = JsonFile.load(normalizedFilePath) as IPackageJson;

      // Make sure this is really a package.json file.  CommonJS has fairly strict requirements,
      // but NPM only requires "name" and "version"
      if (!loadedPackageJson.name) {
        throw new Error(`Error reading "${jsonFilename}":\n  `
          + 'The required field "name" was not found');
      }
      if (!loadedPackageJson.version) {
        throw new Error(`Error reading "${jsonFilename}":\n  `
          + 'The required field "version" was not found');
      }

      if (this._loadExtraFields) {
        packageJson = loadedPackageJson;
      } else {
        packageJson = { } as IPackageJson;

        // Unless "loadExtraFields" was requested, copy over the essential fields only
        packageJson.bin = loadedPackageJson.bin;
        packageJson.dependencies = loadedPackageJson.dependencies;
        packageJson.description = loadedPackageJson.description;
        packageJson.devDependencies = loadedPackageJson.devDependencies;
        packageJson.homepage = loadedPackageJson.homepage;
        packageJson.license = loadedPackageJson.license;
        packageJson.main = loadedPackageJson.main;
        packageJson.name = loadedPackageJson.name;
        packageJson.optionalDependencies = loadedPackageJson.optionalDependencies;
        packageJson.peerDependencies = loadedPackageJson.peerDependencies;
        packageJson.private = loadedPackageJson.private;
        packageJson.scripts = loadedPackageJson.scripts;
        packageJson.typings = loadedPackageJson.typings;
        packageJson.tsdoc = loadedPackageJson.tsdoc;
        packageJson.version = loadedPackageJson.version;
      }

      Object.freeze(packageJson);
      this._packageJsonCache.set(normalizedFilePath, packageJson);
    }

    return packageJson;
  }

  // Recursive part of the algorithm from tryGetPackageFolderFor()
  private _tryGetPackageFolderFor(resolvedFileOrFolderPath: string): string | undefined {
    // Two lookups are required, because get() cannot distinguish the undefined value
    // versus a missing key.
    if (this._packageFolderCache.has(resolvedFileOrFolderPath)) {
      return this._packageFolderCache.get(resolvedFileOrFolderPath);
    }

    // Is resolvedFileOrFolderPath itself a folder with a package.json file?  If so, return it.
    if (FileSystem.exists(path.join(resolvedFileOrFolderPath, FileConstants.PackageJson))) {
      this._packageFolderCache.set(resolvedFileOrFolderPath, resolvedFileOrFolderPath);
      return resolvedFileOrFolderPath;
    }

    // Otherwise go up one level
    const parentFolder: string | undefined = path.dirname(resolvedFileOrFolderPath);
    if (!parentFolder || parentFolder === resolvedFileOrFolderPath) {
      // We reached the root directory without finding a package.json file,
      // so cache the negative result
      this._packageFolderCache.set(resolvedFileOrFolderPath, undefined);
      return undefined;  // no match
    }

    // Recurse upwards, caching every step along the way
    const parentResult: string | undefined = this._tryGetPackageFolderFor(parentFolder);
    // Cache the parent's answer as well
    this._packageFolderCache.set(resolvedFileOrFolderPath, parentResult);

    return parentResult;
  }
}
