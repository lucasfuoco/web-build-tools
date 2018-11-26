// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  CopyTask,
  copyStaticAssets,
  jest,
  task,
  watch,
  serial,
  parallel,
  IExecutable,
  setConfig
} from '@microsoft/gulp-core-build';
import { tscCmd, tslintCmd, apiExtractor } from '@microsoft/gulp-core-build-typescript';
import { instrument, mocha } from '@microsoft/gulp-core-build-mocha';

export * from '@microsoft/gulp-core-build';
export * from '@microsoft/gulp-core-build-typescript';
export * from '@microsoft/gulp-core-build-mocha';

// pre copy and post copy allows you to specify a map of dest: [sources] to copy from one place to another.
export const preCopy: CopyTask = new CopyTask();
preCopy.name = 'pre-copy';

export const postCopy: CopyTask = new CopyTask();
postCopy.name = 'post-copy';

const PRODUCTION: boolean = process.argv.indexOf('--production') !== -1 || process.argv.indexOf('--ship') !== -1;
setConfig({
  production: PRODUCTION,
  shouldWarningsFailBuild: PRODUCTION
});

const buildSubtask: IExecutable = serial(
  preCopy,
  parallel(tslintCmd, tscCmd, copyStaticAssets),
  apiExtractor,
  postCopy
);
export const buildTasks: IExecutable = task('build', buildSubtask);
export const testTasks: IExecutable = task('test', serial(buildSubtask, mocha, jest));
export const defaultTasks: IExecutable = task('default', serial(buildSubtask, instrument, mocha, jest));

task('watch', watch('src/**.ts', testTasks));
