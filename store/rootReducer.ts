import { combineReducers } from '@reduxjs/toolkit';
import { sessionReducer } from './session/sessionSlice';
import { cartReducer } from './cart/cartSlice';
import { ordersReducer } from './orders/ordersSlice';
import { addressesReducer } from './addresses/addressesSlice';
import { categoriesReducer } from './categories/categoriesSlice';
import { storeOptionsReducer } from './storeOptions/storeOptionsSlice';
import { storeConfigReducer } from './storeConfig/storeConfigSlice';
import { productsReducer } from './products/productsSlice';

export const rootReducer = combineReducers({
  session: sessionReducer,
  cart: cartReducer,
  orders: ordersReducer,
  addresses: addressesReducer,
  categories: categoriesReducer,
  storeOptions: storeOptionsReducer,
  storeConfig: storeConfigReducer,
  products: productsReducer,
});
