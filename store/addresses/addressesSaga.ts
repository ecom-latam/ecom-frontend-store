import { call, put, takeLatest } from 'redux-saga/effects';
import { apiGet } from '@/utils/api/http';
import type { Address } from '@/utils/api/addresses';
import { fetchAddressesRequest, fetchAddressesSuccess, fetchAddressesFailure } from './addressesSlice';

function* handleFetchAddresses() {
  try {
    const list: Address[] = yield call(apiGet<Address[]>, '/api/auth/addresses');
    yield put(fetchAddressesSuccess(list));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al cargar direcciones';
    yield put(fetchAddressesFailure(msg));
  }
}

export function* addressesSaga() {
  yield takeLatest(fetchAddressesRequest.type, handleFetchAddresses);
}
