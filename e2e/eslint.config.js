import rootConfig from '../eslint.config.js';

export default [
    ...rootConfig,
    {
        ignores: ['**/playwright-report/**', '**/test-results/**']
    }
];
