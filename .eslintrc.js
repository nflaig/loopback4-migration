module.exports = {
    extends: ["eslint:recommended", "@loopback/eslint-config"],
    overrides: [
        {
            files: ["src/__tests__/**"],
            rules: { "max-nested-callbacks": "off" }
        },
        {
            files: ["src/models/**"],
            rules: { indent: "off" }
        }
    ],
    parserOptions: {
        ecmaVersion: 9,
        sourceType: "module"
    },
    globals: {
        require: true
    },
    env: {
        es6: true
    },
    rules: {
        "no-unused-vars": 2,
        "global-require": 1,
        "no-empty": 2,
        quotes: [0],
        "no-console": 2,
        "no-undef": 2,
        "no-const-assign": 2,
        "prefer-const": 2,
        "func-call-spacing": 2,
        "no-undef-init": 2,
        indent: [
            2,
            4,
            {
                FunctionExpression: { parameters: "first" },
                CallExpression: { arguments: "first" },
                SwitchCase: 1,
                ObjectExpression: "first",
                ArrayExpression: "first"
            }
        ],
        curly: [2, "multi-line"],
        "object-curly-spacing": [2, "always"],
        "comma-dangle": [2, "never"],
        "max-len": [2, 150],
        "max-params": [1, 4],
        "max-lines": [1, 500],
        "max-depth": [1, 3],
        "max-nested-callbacks": [1, 3],
        "@typescript-eslint/no-explicit-any": "off",
        "no-restricted-modules": [
            2,
            {
                paths: [
                    {
                        name: "winston",
                        message: "Please use the wrapper instead."
                    },
                    {
                        name: "fs-extra",
                        message: "Please use the 'fs' module instead."
                    },
                    {
                        name: "async",
                        message: "Please use the native 'Promise' instead."
                    },
                    {
                        name: "mkdirp",
                        message: "Please use the 'fs' module instead."
                    }
                ]
            }
        ]
    }
};
