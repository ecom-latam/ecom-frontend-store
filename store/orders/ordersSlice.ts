import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { Order, OrderStatus, PaymentStatus, PaymentMethod } from '@/utils/api/orders';

export interface AdminOrderListParams {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
}

interface OrdersState {
  list: Order[];
  total: number;
  current: Order | null;
  listLoading: boolean;
  currentLoading: boolean;
  error: string | null;
  currentError: string | null;
}

const initialState: OrdersState = {
  list: [],
  total: 0,
  current: null,
  listLoading: false,
  currentLoading: false,
  error: null,
  currentError: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    fetchMyOrdersRequest(state) {
      state.listLoading = true;
      state.error = null;
    },
    fetchAdminOrdersRequest(state, _action: PayloadAction<AdminOrderListParams>) {
      state.listLoading = true;
      state.error = null;
    },
    fetchOrderListSuccess(state, action: PayloadAction<{ list: Order[]; total: number }>) {
      state.list = action.payload.list;
      state.total = action.payload.total;
      state.listLoading = false;
    },
    fetchOrderListFailure(state, action: PayloadAction<string>) {
      state.error = action.payload;
      state.listLoading = false;
    },
    fetchCurrentOrderRequest(state, _action: PayloadAction<string>) {
      state.currentLoading = true;
      state.currentError = null;
    },
    fetchAdminOrderRequest(state, _action: PayloadAction<string>) {
      state.currentLoading = true;
      state.currentError = null;
    },
    fetchCurrentOrderSuccess(state, action: PayloadAction<Order>) {
      state.current = action.payload;
      state.currentLoading = false;
    },
    fetchCurrentOrderFailure(state, action: PayloadAction<string>) {
      state.currentError = action.payload;
      state.currentLoading = false;
    },
    clearCurrentOrder(state) {
      state.current = null;
      state.currentError = null;
    },
  },
});

export const {
  fetchMyOrdersRequest,
  fetchAdminOrdersRequest,
  fetchOrderListSuccess,
  fetchOrderListFailure,
  fetchCurrentOrderRequest,
  fetchAdminOrderRequest,
  fetchCurrentOrderSuccess,
  fetchCurrentOrderFailure,
  clearCurrentOrder,
} = ordersSlice.actions;

export const ordersReducer = ordersSlice.reducer;
