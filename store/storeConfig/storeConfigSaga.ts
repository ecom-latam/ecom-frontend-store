import { call, put, takeLatest } from 'redux-saga/effects';
import { apiGet } from '@/utils/api/http';
import type { StoreConfigResponse } from '@/utils/api/storeConfig';
import { fetchStoreConfigRequest, fetchStoreConfigSuccess, fetchStoreConfigFailure } from './storeConfigSlice';

function* handleFetchStoreConfig() {
  try {
    const data: StoreConfigResponse = yield call(apiGet<StoreConfigResponse>, '/api/store/store/config');
    yield put(fetchStoreConfigSuccess(data));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar configuración';
    yield put(fetchStoreConfigFailure(msg));
  }
}

export function* storeConfigSaga() {
  yield takeLatest(fetchStoreConfigRequest.type, handleFetchStoreConfig);
}
