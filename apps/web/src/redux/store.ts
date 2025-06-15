import { configureStore, Middleware } from '@reduxjs/toolkit';
import uiReducer from './slices/ui-slice';

const loggerMiddleware: Middleware = (store) => (next) => (action) => {
    if (process.env.NODE_ENV !== 'development') {
        return next(action);
    }

    const actionWithType = action as { type: string };
    console.group(`🔄 ${actionWithType.type}`);
    console.log('Previous State:', store.getState());
    console.log('Action:', action);

    const result = next(action);

    console.log('Next State:', store.getState());
    console.groupEnd();

    return result;
};

export const store = configureStore({
    reducer: {
        ui: uiReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(loggerMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
