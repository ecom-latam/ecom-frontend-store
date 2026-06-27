import { call, put, takeLatest } from 'redux-saga/effects';
import type { PayloadAction } from '@reduxjs/toolkit';
import { apiGet } from '@/utils/api/http';
import type { ProductListParams, ProductListResponse } from '@/utils/api/products';
import { fetchProductsRequest, fetchProductsSuccess, fetchProductsFailure } from './productsSlice';

function* handleFetchProducts(action: PayloadAction<ProductListParams | undefined>) {
  try {
    const params = action.payload ?? {};
    const query = new URLSearchParams();
    if (params.page)       query.set('page', String(params.page));
    if (params.limit)      query.set('limit', String(params.limit));
    if (params.q)          query.set('q', params.q);
    if (params.status)     query.set('status', params.status);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    const url = `/api/product/products${query.toString() ? `?${query}` : ''}`;
    const res: ProductListResponse = yield call(apiGet<ProductListResponse>, url);
    yield put(fetchProductsSuccess({ list: res.data ?? [], total: res.total ?? 0 }));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar productos';
    yield put(fetchProductsFailure(msg));
  }
}

export function* productsSaga() {
  yield takeLatest(fetchProductsRequest.type, handleFetchProducts);
}
