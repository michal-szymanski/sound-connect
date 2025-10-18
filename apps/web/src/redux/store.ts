import { configureStore } from '@reduxjs/toolkit';
import { loggerMiddleware } from '@/web/redux/middlewares/logger';
import uiReducer from './slices/ui-slice';

export const store = configureStore({
    reducer: {
        ui: uiReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(loggerMiddleware)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
