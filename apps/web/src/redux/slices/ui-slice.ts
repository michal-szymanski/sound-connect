import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
    isSidebarVisible: boolean;
}

const initialState: UIState = {
    isSidebarVisible: true
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        showSidebar: (state, action: PayloadAction<boolean>) => {
            state.isSidebarVisible = action.payload;
        }
    }
});

export const { showSidebar } = uiSlice.actions;

export default uiSlice.reducer;
