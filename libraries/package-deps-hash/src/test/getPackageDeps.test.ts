// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { getPackageDeps, parseGitLsTree } from '../getPackageDeps';
import { IPackageDeps } from '../IPackageDeps';
import { expect, assert } from 'chai';
import * as path from 'path';
import { execSync } from 'child_process';

import {
  FileSystem,
  FileConstants
} from '@microsoft/node-core-library';

const SOURCE_PATH: string = path.join(__dirname).replace(
  path.join('lib', 'test'),
  path.join('src', 'test'));

const TEST_PROJECT_PATH: string = path.join(SOURCE_PATH, 'testProject');
const NESTED_TEST_PROJECT_PATH: string = path.join(SOURCE_PATH, 'nestedTestProject');

describe('parseGitLsTree', () => {
  it('can handle a blob', (done) => {
    const filename: string = 'src/typings/tsd.d.ts';
    const hash: string = '3451bccdc831cb43d7a70ed8e628dcf9c7f888c8';

    const output: string = `100644 blob ${hash}\t${filename}`;
    const changes: Map<string, string> = parseGitLsTree(output);

    assert.equal(changes.size, 1, 'Expect there to be exactly 1 change');
    assert.equal(changes.get(filename), hash, `Expect the hash to be ${hash}`);
    done();
  });

  it('can handle a submodule', (done) => {
    const filename: string = 'web-build-tools';
    const hash: string = 'c5880bf5b0c6c1f2e2c43c95beeb8f0a808e8bac';

    const output: string = `160000 commit ${hash}\t${filename}`;
    const changes: Map<string, string> = parseGitLsTree(output);

    assert.equal(changes.size, 1, 'Expect there to be exactly 1 change');
    assert.equal(changes.get(filename), hash, `Expect the hash to be ${hash}`);
    done();
  });

  it('can handle multiple lines', (done) => {
    const filename1: string = 'src/typings/tsd.d.ts';
    const hash1: string = '3451bccdc831cb43d7a70ed8e628dcf9c7f888c8';

    const filename2: string = 'src/foo bar/tsd.d.ts';
    const hash2: string = '0123456789abcdef1234567890abcdef01234567';

    const output: string = `100644 blob ${hash1}\t${filename1}\n100666 blob ${hash2}\t${filename2}`;
    const changes: Map<string, string> = parseGitLsTree(output);

    assert.equal(changes.size, 2, 'Expect there to be exactly 2 changes');
    assert.equal(changes.get(filename1), hash1, `Expect the hash to be ${hash1}`);
    assert.equal(changes.get(filename2), hash2, `Expect the hash to be ${hash2}`);
    done();
  });

  it('throws with malformed input', (done) => {
    assert.throws(parseGitLsTree.bind(undefined, 'some super malformed input'));
    done();
  });
});

describe('getPackageDeps', () => {

  it('can parse commited file', (done) => {
    const results: IPackageDeps = getPackageDeps(TEST_PROJECT_PATH);
    try {
      const expectedFiles: { [key: string]: string } = {
        'file1.txt': 'c7b2f707ac99ca522f965210a7b6b0b109863f34',
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      filePaths.forEach(filePath => (
        expect(results.files[filePath])
          .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) { return done(e); }

    done();
  });

  it('can handle files in subfolders', (done) => {
    const results: IPackageDeps = getPackageDeps(NESTED_TEST_PROJECT_PATH);
    try {
      const expectedFiles: { [key: string]: string } = {
        'src/file 1.txt': 'c7b2f707ac99ca522f965210a7b6b0b109863f34',
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      filePaths.forEach(filePath => (
        expect(results.files[filePath])
          .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) { return done(e); }

    done();
  });

  it('can can handle adding one file', (done) => { // tslint:disable-line
    const tempFilePath: string = path.join(TEST_PROJECT_PATH, 'a.txt');

    FileSystem.writeFile(tempFilePath, 'a');

    function _done(e?: Error): void {
      FileSystem.deleteFile(tempFilePath);
      done(e);
    }

    const results: IPackageDeps = getPackageDeps(TEST_PROJECT_PATH);
    try {
      const expectedFiles: { [key: string]: string } = {
        'a.txt': '2e65efe2a145dda7ee51d1741299f848e5bf752e',
        'file1.txt': 'c7b2f707ac99ca522f965210a7b6b0b109863f34',
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      filePaths.forEach(filePath => (
        expect(
          results.files[filePath])
            .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) {
      return _done(e);
    }

    _done();

  });

  it('can can handle adding two files', (done) => { // tslint:disable-line
    const tempFilePath1: string = path.join(TEST_PROJECT_PATH, 'a.txt');
    const tempFilePath2: string = path.join(TEST_PROJECT_PATH, 'b.txt');

    FileSystem.writeFile(tempFilePath1, 'a');
    FileSystem.writeFile(tempFilePath2, 'a');

    function _done(e?: Error): void {
      FileSystem.deleteFile(tempFilePath1);
      FileSystem.deleteFile(tempFilePath2);
      done(e);
    }

    const results: IPackageDeps = getPackageDeps(TEST_PROJECT_PATH);
    try {
      const expectedFiles: { [key: string]: string } = {
        'a.txt': '2e65efe2a145dda7ee51d1741299f848e5bf752e',
        'b.txt': '2e65efe2a145dda7ee51d1741299f848e5bf752e',
        'file1.txt': 'c7b2f707ac99ca522f965210a7b6b0b109863f34',
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      filePaths.forEach(filePath => (
        expect(
          results.files[filePath])
            .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) {
      return _done(e);
    }

    _done();
  });

  it('can can handle removing one file', (done) => {
    const testFilePath: string = path.join(TEST_PROJECT_PATH, 'file1.txt');

    FileSystem.deleteFile(testFilePath);

    function _done(e?: Error): void {
      execSync(`git checkout ${ testFilePath }`);
      done(e);
    }

    const results: IPackageDeps = getPackageDeps(TEST_PROJECT_PATH);
    try {
      const expectedFiles: { [key: string]: string } = {
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      filePaths.forEach(filePath => (
        expect(results.files[filePath])
          .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) {
      return _done(e);
    }

    _done();
  });

  it('can can handle changing one file', (done) => {
    const testFilePath: string = path.join(TEST_PROJECT_PATH, 'file1.txt');

    FileSystem.writeFile(testFilePath, 'abc');

    function _done(e?: Error): void {
      execSync(`git checkout ${testFilePath}`);
      done(e);
    }

    const results: IPackageDeps = getPackageDeps(TEST_PROJECT_PATH);
    try {
      const expectedFiles: { [key: string]: string } = {
        'file1.txt': 'f2ba8f84ab5c1bce84a7b441cb1959cfc7093b7f',
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      filePaths.forEach(filePath => (
        expect(results.files[filePath])
          .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) {
      return _done(e);
    }

    _done();
  });

  it('can exclude a committed file', (done) => {
    const results: IPackageDeps = getPackageDeps(TEST_PROJECT_PATH, ['file1.txt']);
    try {
      const expectedFiles: { [key: string]: string } = {
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      filePaths.forEach(filePath => (
        expect(results.files[filePath])
          .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) { return done(e); }

    done();
  });

  it('can exclude an added file', (done) => {
    const tempFilePath: string = path.join(TEST_PROJECT_PATH, 'a.txt');

    FileSystem.writeFile(tempFilePath, 'a');

    function _done(e?: Error): void {
      FileSystem.deleteFile(tempFilePath);
      done(e);
    }

    const results: IPackageDeps = getPackageDeps(TEST_PROJECT_PATH, ['a.txt']);
    try {
      const expectedFiles: { [key: string]: string } = {
        'file1.txt': 'c7b2f707ac99ca522f965210a7b6b0b109863f34',
        [FileConstants.PackageJson]: '33703d582243a41bdebff8ee7dd046a01fc054b9'
      };
      const filePaths: string[] = Object.keys(results.files).sort();

      expect(filePaths.length).to.equal(Object.keys(expectedFiles).length, 'filePaths.length');

      filePaths.forEach(filePath => (
        expect(
          results.files[filePath])
            .equals(expectedFiles[filePath], `path: ${filePath}`)));

    } catch (e) {
      return _done(e);
    }

    _done();
  });

});
