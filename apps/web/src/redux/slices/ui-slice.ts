import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type UIState = {
    isSidebarVisible: boolean;
    isSidebarCollapsed: boolean;
};

const initialState: UIState = {
    isSidebarVisible: true,
    isSidebarCollapsed: false
};

export const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        showSidebar: (state, action: PayloadAction<boolean>) => {
            state.isSidebarVisible = action.payload;
        },
        collapseSidebar: (state, action: PayloadAction<boolean>) => {
            state.isSidebarCollapsed = action.payload;
        }
    }
});

export const { showSidebar, collapseSidebar } = uiSlice.actions;

export default uiSlice.reducer;
