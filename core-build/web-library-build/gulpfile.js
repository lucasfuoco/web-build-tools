'use strict';

let build = require('@microsoft/node-library-build');
build.mocha.enabled = false;
build.initialize(require('gulp'));
