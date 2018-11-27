'use strict';

let build = require('@microsoft/gulp-core-build');
let { tscCmd, tslintCmd, apiExtractor } = require('@microsoft/gulp-core-build-typescript')
let jest = require('gulp-jest').default;

build.setConfig({
  shouldWarningsFailBuild: build.getConfig().production
});

let jestTask = build.subTask('jest', (gulp, buildOptions, done) => {
    return gulp.src('src/**/*.test.ts').pipe(jest({
        "projects": ["<rootDir>/jest.config.js"]
    }));
});

build.task('default', build.serial(build.parallel(tscCmd, tslintCmd), apiExtractor, jestTask));

build.initialize(require('gulp'));
