import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.wrangler/**',
            '**/build/**',
            '**/.vinxi/**',
            '**/worker-configuration.d.ts',
            '**/wrangler-env.d.ts',
            '**/components/ui/**'
        ]
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            import: importPlugin
        },
        languageOptions: {
            parserOptions: {
                projectService: true
            }
        },
        settings: {
            'import/core-modules': ['cloudflare:workers']
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_',
                    destructuredArrayIgnorePattern: '^_'
                }
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'CallExpression[callee.property.name="findIndex"]',
                    message: 'NEVER use Array.findIndex, ALWAYS use Array.find instead'
                }
            ]
        }
    }
];
