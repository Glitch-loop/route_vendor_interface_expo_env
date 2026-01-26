import { configureStore } from '@reduxjs/toolkit';
import userSlice from '@/redux/slices/userSlice';
import routeDaySlice from '@/redux/slices/routeDaySlice';
import productsInventorySlice from '@/redux/slices/productsInventorySlice';
import dayOperationsSlice from '@/redux/slices/dayOperationsSlice';
import storesSlice from '@/redux/slices/storesSlice';
import currentOperationSlice from '@/redux/slices/currentOperationSlice';
import workDayInformation from '@/redux/slices/workdayInformation';
import routeSlice from '@/redux/slices/routeSlice';
import productSlice from '@/redux/slices/productSlice';

const store = configureStore({
  reducer: {
    user: userSlice,
    routeDay: routeDaySlice,
    productsInventory: productsInventorySlice,
    dayOperations: dayOperationsSlice,
    stores: storesSlice,
    currentOperation: currentOperationSlice,
    workDayInformation: workDayInformation,
    route: routeSlice,
    products: productSlice
  },
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
