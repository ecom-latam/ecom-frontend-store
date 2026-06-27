import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiGet } from '@/utils/api/http';
import type { Order, OrderListResponse } from '@/utils/api/orders';
import type { AdminOrderListParams } from './ordersSlice';
import {
  fetchMyOrdersRequest,
  fetchAdminOrdersRequest,
  fetchOrderListSuccess,
  fetchOrderListFailure,
  fetchCurrentOrderRequest,
  fetchAdminOrderRequest,
  fetchCurrentOrderSuccess,
  fetchCurrentOrderFailure,
} from './ordersSlice';

function* handleFetchMyOrders() {
  try {
    const res: OrderListResponse = yield call(apiGet<OrderListResponse>, '/api/order/orders/my');
    yield put(fetchOrderListSuccess({ list: res.data ?? [], total: res.total ?? 0 }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar pedidos';
    yield put(fetchOrderListFailure(msg));
  }
}

function* handleFetchAdminOrders(action: PayloadAction<AdminOrderListParams>) {
  try {
    const params = action.payload;
    const query = new URLSearchParams();
    if (params.page)          query.set('page', String(params.page));
    if (params.limit)         query.set('limit', String(params.limit));
    if (params.status)        query.set('status', params.status);
    if (params.paymentStatus) query.set('paymentStatus', params.paymentStatus);
    if (params.paymentMethod) query.set('paymentMethod', params.paymentMethod);
    const url = `/api/order/admin/orders?${query}`;
    const res: OrderListResponse = yield call(apiGet<OrderListResponse>, url);
    yield put(fetchOrderListSuccess({ list: res.data ?? [], total: res.total ?? 0 }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar pedidos';
    yield put(fetchOrderListFailure(msg));
  }
}

function* handleFetchCurrentOrder(action: PayloadAction<string>) {
  try {
    const order: Order = yield call(apiGet<Order>, `/api/order/orders/${action.payload}`);
    yield put(fetchCurrentOrderSuccess(order));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar el pedido';
    yield put(fetchCurrentOrderFailure(msg));
  }
}

function* handleFetchAdminOrder(action: PayloadAction<string>) {
  try {
    const order: Order = yield call(apiGet<Order>, `/api/order/admin/orders/${action.payload}`);
    yield put(fetchCurrentOrderSuccess(order));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar el pedido';
    yield put(fetchCurrentOrderFailure(msg));
  }
}

export function* ordersSaga() {
  yield takeLatest(fetchMyOrdersRequest.type, handleFetchMyOrders);
  yield takeLatest(fetchAdminOrdersRequest.type, handleFetchAdminOrders);
  yield takeLatest(fetchCurrentOrderRequest.type, handleFetchCurrentOrder);
  yield takeLatest(fetchAdminOrderRequest.type, handleFetchAdminOrder);
}
