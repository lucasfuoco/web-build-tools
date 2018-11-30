module.exports = require("babel-jest").createTransformer((api) => {
    api.cache(true);
    return {
        rootMode: "upward",
        presets: [
            "@babel/preset-env",
            "@babel/preset-react"
        ],
        plugins: [
            "@babel/plugin-transform-classes",
            "@babel/plugin-transform-runtime"
        ]
    }
});