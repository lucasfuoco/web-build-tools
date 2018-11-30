const path = require('path');
const merge = require('./merge');
const resolve = require('resolve');

const styleMockPath = (module.exports = {
    createRawConfig: () => ({
        rootDir: 'lib',
        testRegex: '(/__tests__/.*|\\.(test|spec))\\.js$'
    }),
    createConfig: customConfig =>
        merge({
            rootDir: './',
            roots: [
                '<rootDir>'
            ],
            modulePaths: [
                '<rootDir>'
            ],
            cache: false,
            verbose: true,
            transform: {
                "^.+\\.js?$": "<rootDir>/wrapper.js"
            },
            reporters: [path.resolve(__dirname, './jest-reporter.js')],

            testMatch: [
                "<rootDir>/**/__tests__/**/*.{js,jsx}",
                "<rootDir>/**/?(*.)(spec|test).{js,jsx}"
            ],
            moduleFileExtensions: ['js', 'jsx', 'json'],

            setupFiles: [
                // path.resolve(__dirname, 'jest-setup.js')
            ],

            moduleDirectories: [
                'node_modules',
                path.resolve(process.cwd(), 'node_modules'),
                path.resolve(__dirname, '../node_modules')
            ],
            // testResultsProcessor: "<rootDir>/node_modules/ts-jest/coverageprocessor.js",
            globals: {
            },
            testURL: 'http://localhost',
            collectCoverage: true
        },
            customConfig
        )
});