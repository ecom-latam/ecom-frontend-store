import { call, put, takeLatest } from 'redux-saga/effects';
import { apiGet } from '@/utils/api/http';
import type { Category } from '@/utils/api/categories';
import { fetchCategoriesRequest, fetchCategoriesSuccess, fetchCategoriesFailure } from './categoriesSlice';

function* handleFetchCategories() {
  try {
    const list: Category[] = yield call(apiGet<Category[]>, '/api/product/categories');
    yield put(fetchCategoriesSuccess(list));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar categorías';
    yield put(fetchCategoriesFailure(msg));
  }
}

export function* categoriesSaga() {
  yield takeLatest(fetchCategoriesRequest.type, handleFetchCategories);
}
