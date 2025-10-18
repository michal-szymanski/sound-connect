import rootConfig from '../../eslint.config.js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import tanstackQueryPlugin from '@tanstack/eslint-plugin-query';

export default [
    ...rootConfig,
    {
        files: ['**/*.tsx', '**/*.jsx'],
        plugins: {
            react: reactPlugin,
            'react-hooks': reactHooksPlugin,
            '@tanstack/query': tanstackQueryPlugin
        },
        settings: {
            react: {
                version: 'detect'
            }
        },
        rules: {
            ...reactPlugin.configs.recommended.rules,
            ...reactHooksPlugin.configs.recommended.rules,
            ...tanstackQueryPlugin.configs.recommended.rules,
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'CallExpression[callee.property.name="findIndex"]',
                    message: 'NEVER use Array.findIndex, ALWAYS use Array.find instead'
                },
                {
                    selector: 'CallExpression[callee.object.name="document"][callee.property.name="querySelector"]',
                    message: 'Avoid using querySelector - use refs instead'
                },
                {
                    selector: 'CallExpression[callee.object.name="document"][callee.property.name="querySelectorAll"]',
                    message: 'Avoid using querySelectorAll - use refs instead'
                }
            ]
        }
    }
];
