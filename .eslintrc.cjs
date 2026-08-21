module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', 'out', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  overrides: [
    {
      // The main process runs in Node, not the browser.
      files: ['src/main/**/*.js', '*.config.js'],
      env: { node: true, browser: false },
    },
    {
      // Preload bridges the two: it sees both Node and window.
      files: ['src/preload/**/*.js'],
      env: { node: true, browser: true },
    },
  ],
  rules: {
    'react/jsx-no-target-blank': 'off',
    // The renderer is a small single-author app; types are not modelled
    // with PropTypes.
    'react/prop-types': 'off',
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
}
