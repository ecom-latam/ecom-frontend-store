import { call, put, takeLatest } from 'redux-saga/effects';
import { apiGet } from '@/utils/api/http';
import type { StoreOption } from '@/utils/api/storeOptions';
import { fetchStoreOptionsRequest, fetchStoreOptionsSuccess, fetchStoreOptionsFailure } from './storeOptionsSlice';

function* handleFetchStoreOptions() {
  try {
    const list: StoreOption[] = yield call(apiGet<StoreOption[]>, '/api/product/store-options');
    yield put(fetchStoreOptionsSuccess(list));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar opciones';
    yield put(fetchStoreOptionsFailure(msg));
  }
}

export function* storeOptionsSaga() {
  yield takeLatest(fetchStoreOptionsRequest.type, handleFetchStoreOptions);
}
