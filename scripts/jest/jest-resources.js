const path = require('path');
const merge = require('./merge');
const resolve = require('resolve');
const tsJestPresets = require('ts-jest/presets');

const preset = tsJestPresets.jsWithTs;

const styleMockPath = (module.exports = {
    createRawConfig: () => ({
        rootDir: 'lib',
        testRegex: '(/__tests__/.*|\\.(test|spec))\\.js$'
    }),
    createConfig: customConfig =>
        merge({
            rootDir: 'src',
            roots: [
                '<rootDir>'
            ],
            modulePaths: [
                '<rootDir>'
            ],
            verbose: true,
            preset: 'ts-jest',
            transform: {
                ...preset.transform
            },
            reporters: [path.resolve(__dirname, './jest-reporter.js')],

            testMatch: [
                "<rootDir>/**/__tests__/**/*.{ts,tsx}",
                "<rootDir>/**/?(*.)(spec|test).{ts,tsx}"
            ],
            moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

            setupFiles: [
                path.resolve(__dirname, 'jest-setup.js')
            ],

            moduleDirectories: [
                'node_modules',
                path.resolve(process.cwd(), 'node_modules'),
                path.resolve(__dirname, '../node_modules')
            ],
            // testResultsProcessor: "<rootDir>/node_modules/ts-jest/coverageprocessor.js",
            globals: {
                'ts-jest': {
                    tsConfig: {
                        allowJs: true,
                        declaration: false
                    },
                    isolatedModules: true,
                }
            },
            testURL: 'http://localhost',
            collectCoverage: true,
            mapCoverage: true
        },
            customConfig
        )
});