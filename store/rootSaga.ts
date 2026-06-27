import { all } from 'redux-saga/effects';
import { sessionSaga } from './session/sessionSaga';
import { cartSaga } from './cart/cartSaga';
import { ordersSaga } from './orders/ordersSaga';
import { addressesSaga } from './addresses/addressesSaga';
import { categoriesSaga } from './categories/categoriesSaga';
import { storeOptionsSaga } from './storeOptions/storeOptionsSaga';
import { storeConfigSaga } from './storeConfig/storeConfigSaga';
import { productsSaga } from './products/productsSaga';

export function* rootSaga() {
  yield all([
    sessionSaga(),
    cartSaga(),
    ordersSaga(),
    addressesSaga(),
    categoriesSaga(),
    storeOptionsSaga(),
    storeConfigSaga(),
    productsSaga(),
  ]);
}
