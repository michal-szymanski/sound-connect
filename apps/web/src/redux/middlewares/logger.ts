import type { Action, Middleware } from '@reduxjs/toolkit';

const colors = {
    prevState: '#9E9E9E',
    action: '#03A9F4',
    nextState: '#4CAF50',
    error: '#F20404'
} as const;

export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
    if (process.env['NODE_ENV'] !== 'development') {
        return next(action);
    }

    const typedAction = action as Action;
    const timestamp = new Date().toLocaleTimeString();

    console.group(
        `%caction %c${typedAction.type} %c@ ${timestamp}`,
        `color: ${colors.action}; font-weight: bold;`,
        `color: ${colors.nextState}; font-weight: bold;`,
        `color: ${colors.prevState}; font-weight: normal;`
    );

    console.log('%cprev state', `color: ${colors.prevState}; font-weight: bold;`, store.getState());

    console.log('%caction    ', `color: ${colors.action}; font-weight: bold;`, action);

    const result = next(action);

    console.log('%cnext state', `color: ${colors.nextState}; font-weight: bold;`, store.getState());

    console.groupEnd();

    return result;
};
