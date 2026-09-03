import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // `eslint-plugin-react` is not installed, so nothing marks an identifier
      // used when it only appears inside JSX. Two consequences to work around:
      //
      //  - Components referenced as `<Icon />` or `<motion.div>` look unused.
      //    Capitalised names are exempted for that reason, and `motion` is
      //    named explicitly because it is the one lowercase JSX namespace we use.
      //  - A component passed in as a prop (`{ icon: Icon }`) is an *argument*,
      //    not a variable, so it needs argsIgnorePattern as well - without it
      //    every render-prop component reports a false error.
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^(motion|[A-Z_])',
          argsIgnorePattern: '^(_|[A-Z])',
          caughtErrors: 'none',
        },
      ],
    },
  },
  {
    // Vite's config runs in Node, not the browser.
    files: ['vite.config.js'],
    languageOptions: { globals: globals.node },
  },
])
