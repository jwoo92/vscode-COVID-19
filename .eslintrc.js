'use strict';

const ERROR = 2;
const WARN = 1;
const OFF = 0;

module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:security/recommended',
    'plugin:jest/recommended',
    'airbnb-base',
    'prettier',
  ],
  plugins: ['node', 'security', 'jest', 'prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  env: {
    browser: false,
    commonjs: true,
    es6: true,
    node: true,
    'jest/globals': true,
  },
  rules: {
    'prettier/prettier': ERROR,
    'max-len': ERROR,
    'no-unused-vars': [ERROR, { skipShapeProps: true }],
    'import/no-unresolved': [ERROR, { ignore: ['vscode'] }],
    'node/no-missing-require': [
      ERROR,
      {
        allowModules: ['vscode'],
      },
    ],
    'node/no-unsupported-features/es-syntax': [ERROR, { ignores: ['modules'] }],
    'node/no-missing-import': [
      ERROR,
      {
        allowModules: ['vscode'],
      },
    ],
    'jest/no-disabled-tests': WARN,
    'jest/no-focused-tests': ERROR,
    'jest/no-identical-title': ERROR,
    'jest/prefer-to-have-length': WARN,
    'jest/valid-expect': ERROR,
    //
    'no-const-assign': ERROR,
    'no-this-before-super': ERROR,
    'no-undef': ERROR,
    'no-unreachable': ERROR,
    'no-param-reassign': OFF,
    'constructor-super': ERROR,
    'valid-typeof': ERROR,
    'security/detect-object-injection': OFF,
    'class-methods-use-this': [ERROR, { exceptMethods: ['deactivate'] }],
  },
  overrides: [
    {
      files: ['jest.config.js'],
      rules: {
        'max-len': OFF,
      },
    },
    {
      files: ['rollup.config.js'],
      rules: {
        'node/no-unpublished-require': OFF,
      },
    },
    {
      files: ['extension.test.js'],
      rules: {
        'jest/no-mocks-import': OFF,
        'no-unused-vars': OFF,
      },
    },
  ],
};
