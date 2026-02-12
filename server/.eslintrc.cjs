module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'linebreak-style': 0,
    'no-console': 0,
    'import/extensions': 0,
    'object-curly-newline': 0,
    'no-restricted-syntax': 0,
    'no-plusplus': 0,
    'implicit-arrow-linebreak': 0,
    'function-paren-newline': 0,
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      files: ['src/controller/tipscontroller.js'],
      rules: {
        'no-underscore-dangle': 0,
        'nonblock-statement-body-position': 0,
        curly: 0,
        'no-continue': 0,
        'no-multi-spaces': 0,
        'no-nested-ternary': 0,
        indent: 0,
        'import/prefer-default-export': 0,
      },
    },
  ],
};
