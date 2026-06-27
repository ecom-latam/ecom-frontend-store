import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { StoreConfigResponse } from '@/utils/api/storeConfig';

interface StoreConfigState {
  data: StoreConfigResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: StoreConfigState = {
  data: null,
  loading: false,
  error: null,
};

const storeConfigSlice = createSlice({
  name: 'storeConfig',
  initialState,
  reducers: {
    fetchStoreConfigRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchStoreConfigSuccess(state, action: PayloadAction<StoreConfigResponse>) {
      state.data = action.payload;
      state.loading = false;
    },
    fetchStoreConfigFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { fetchStoreConfigRequest, fetchStoreConfigSuccess, fetchStoreConfigFailure } = storeConfigSlice.actions;
export const storeConfigReducer = storeConfigSlice.reducer;
