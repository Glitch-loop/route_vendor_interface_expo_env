import { createSlice, PayloadAction, Store } from '@reduxjs/toolkit';
import StoreDTO from '@/src/application/dto/StoreDTO';

/*
  The purpose of this context is to store the information of all the routes that are going to be
  visited during the day.
*/

const storesSlice = createSlice({
  name: 'stores',
  initialState: null as StoreDTO[] | null,
  reducers: {
    setStores: (state, action: PayloadAction<StoreDTO[]>) => {
      // This function is used for initialize a route.
      return action.payload.map(store => {
          return {
            // Related to information of the stores
            id_store: store.id_store,
            street: store.street,
            ext_number: store.ext_number,
            colony: store.colony,
            postal_code: store.postal_code,
            address_reference: store.address_reference,
            store_name: store.store_name,
            latitude: store.latitude,
            longitude: store.longitude,
            creation_date: store.creation_date,
            status_store: store.status_store,
            is_new: store.is_new
          };
      });
    },
    clearStores: (state) => {
      return null;
    },
  },
});


export const { setStores, clearStores } = storesSlice.actions;

export default storesSlice.reducer;
