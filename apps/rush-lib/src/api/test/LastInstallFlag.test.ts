import * as path from 'path';

import { LastInstallFlag } from '../LastInstallFlag';
import { FileSystem } from '@microsoft/node-core-library';

const TEMP_DIR: string = path.join(__dirname, 'temp');

describe('LastInstallFlag', () => {
  beforeEach(() => {
    FileSystem.ensureEmptyFolder(TEMP_DIR);
  });

  afterEach(() => {
    FileSystem.ensureEmptyFolder(TEMP_DIR);
  });

  it('can create and remove a flag in an empty directory', () => {
    // preparation
    const flag: LastInstallFlag = new LastInstallFlag(TEMP_DIR);
    FileSystem.deleteFile(flag.path);

    // test state, should be invalid since the file doesn't exist
    expect(flag.isValid()).toEqual(false);

    // test creation
    flag.create();
    expect(FileSystem.exists(flag.path)).toEqual(true);
    expect(flag.isValid()).toEqual(true);

    // test deletion
    flag.clear();
    expect(FileSystem.exists(flag.path)).toEqual(false);
    expect(flag.isValid()).toEqual(false);
  });

  it('can detect if the last flag was in a different state', () => {
    // preparation
    const flag1: LastInstallFlag = new LastInstallFlag(TEMP_DIR, { node: '5.0.0' });
    const flag2: LastInstallFlag = new LastInstallFlag(TEMP_DIR, { node: '8.9.4' });
    FileSystem.deleteFile(flag1.path);

    // test state, should be invalid since the file doesn't exist
    expect(flag1.isValid()).toEqual(false);
    expect(flag2.isValid()).toEqual(false);

    // test creation
    flag1.create();
    expect(FileSystem.exists(flag1.path)).toEqual(true);
    expect(flag1.isValid()).toEqual(true);

    // the second flag has different state and should be invalid
    expect(flag2.isValid()).toEqual(false);

    // test deletion
    flag1.clear();
    expect(FileSystem.exists(flag1.path)).toEqual(false);
    expect(flag1.isValid()).toEqual(false);
    expect(flag2.isValid()).toEqual(false);
  });

  it('can detect if the last flag was in a corrupted state', () => {
    // preparation, write non-json into flag file
    const flag: LastInstallFlag = new LastInstallFlag(TEMP_DIR);
    FileSystem.writeFile(flag.path, 'sdfjkaklfjksldajgfkld');

    // test state, should be invalid since the file is not JSON
    expect(flag.isValid()).toEqual(false);
    FileSystem.deleteFile(flag.path);
  });
});