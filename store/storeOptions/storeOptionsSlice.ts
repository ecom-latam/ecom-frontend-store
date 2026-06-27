import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { StoreOption } from '@/utils/api/storeOptions';

interface StoreOptionsState {
  list: StoreOption[];
  loading: boolean;
  error: string | null;
}

const initialState: StoreOptionsState = {
  list: [],
  loading: false,
  error: null,
};

const storeOptionsSlice = createSlice({
  name: 'storeOptions',
  initialState,
  reducers: {
    fetchStoreOptionsRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchStoreOptionsSuccess(state, action: PayloadAction<StoreOption[]>) {
      state.list = action.payload;
      state.loading = false;
    },
    fetchStoreOptionsFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { fetchStoreOptionsRequest, fetchStoreOptionsSuccess, fetchStoreOptionsFailure } = storeOptionsSlice.actions;
export const storeOptionsReducer = storeOptionsSlice.reducer;
