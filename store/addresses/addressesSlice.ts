import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Address } from '@/utils/api/addresses';

interface AddressesState {
  list: Address[];
  loading: boolean;
  error: string | null;
}

const initialState: AddressesState = {
  list: [],
  loading: false,
  error: null,
};

const addressesSlice = createSlice({
  name: 'addresses',
  initialState,
  reducers: {
    fetchAddressesRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchAddressesSuccess(state, action: PayloadAction<Address[]>) {
      state.list = action.payload;
      state.loading = false;
    },
    fetchAddressesFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { fetchAddressesRequest, fetchAddressesSuccess, fetchAddressesFailure } = addressesSlice.actions;
export const addressesReducer = addressesSlice.reducer;
