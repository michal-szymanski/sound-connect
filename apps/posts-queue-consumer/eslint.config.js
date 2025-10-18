import rootConfig from '../../eslint.config.js';

export default [
    ...rootConfig,
    {
        files: ['**/*.ts'],
        rules: {
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
