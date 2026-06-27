import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Category } from '@/utils/api/categories';

interface CategoriesState {
  list: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  list: [],
  loading: false,
  error: null,
};

const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    fetchCategoriesRequest(state) {
      state.loading = true;
      state.error = null;
    },
    fetchCategoriesSuccess(state, action: PayloadAction<Category[]>) {
      state.list = action.payload;
      state.loading = false;
    },
    fetchCategoriesFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const { fetchCategoriesRequest, fetchCategoriesSuccess, fetchCategoriesFailure } = categoriesSlice.actions;
export const categoriesReducer = categoriesSlice.reducer;
