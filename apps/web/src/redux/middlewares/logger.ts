import type { Action, Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
    if (process.env.NODE_ENV !== 'development') {
        return next(action);
    }

    const typedAction = action as Action;
    console.group(`🔄 ${typedAction.type}`);
    console.log('Previous State:', store.getState());
    console.log('Action:', action);

    const result = next(action);

    console.log('Next State:', store.getState());
    console.groupEnd();

    return result;
};
