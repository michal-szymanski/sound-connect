import { configureStore, Tuple } from '@reduxjs/toolkit';
import uiReducer from './slices/ui-slice';
import { createLogger } from 'redux-logger';

const logger = createLogger();

export const store = configureStore({
    reducer: {
        ui: uiReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(logger)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
