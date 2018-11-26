'use strict';

const build = require('@microsoft/node-library-build');

build.tscCmd = 'tsc-commonjs';

const tscAmdTask = new build.TscCmdTask();
tscAmdTask.name = 'tsc-amd';
tscAmdTask.setConfig({
  customArgs: [
    '--outDir', './lib-amd',
    '--module', 'amd'
  ]
});

const tscEsnextTask = new build.TscCmdTask();
tscEsnextTask.name = 'tsc-es6';
tscEsnextTask.setConfig({
  customArgs: [
    '--outDir', './lib-es6',
    '--module', 'esnext'
  ]
});

build.defaultTasks = build.task(
  'default',
  build.parallel(
    build.defaultTasks,
    tscAmdTask,
    tscEsnextTask
  )
);

build.setConfig({
  libAMDFolder: 'lib-amd',
  libES6Folder: 'lib-es6'
});

build.initialize(require('gulp'));
