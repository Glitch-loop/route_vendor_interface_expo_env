import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IStore, IStoreStatusDay } from '../../interfaces/interfaces';

/*
  The purpose of this context is to store the information of all the routes that are going to be
  visited during the day.
*/

const initialState: (IStore&IStoreStatusDay)[] = [];

const storesSlice = createSlice({
  name: 'stores',
  initialState,
  reducers: {
    setStores: (state, action: PayloadAction<(IStore&IStoreStatusDay)[]>) => {
      // This function is used for initialize a route.
      return action.payload.map(store => {
        let index = state.findIndex(storedStore =>
          storedStore.id_store === store.id_store);

        if(index === -1) {
          // Save store
          return {
            // Related to information of the stores
            id_store: store.id_store,
            street: store.street,
            ext_number: store.ext_number,
            colony: store.colony,
            postal_code: store.postal_code,
            address_reference: store.address_reference,
            store_name: store.store_name,
            owner_name: store.owner_name,
            cellphone: store.cellphone,
            latitude: store.latitude,
            longuitude: store.longuitude,
            id_creator: store.id_creator,
            creation_date: store.creation_date,
            creation_context: store.creation_context,
            status_store: store.status_store,

            /*
              Related to the information of the stores in the context of the route.
              This configuration indicates that the store is one of the route itself.
            */
            route_day_state: store.route_day_state,
          };
        } else {
          // The store already exists. Update the information.
          return {
            ...store,
            route_day_state: store.route_day_state,
          };
        }
      });
    },
    updateStores: (state, action: PayloadAction<(IStore&IStoreStatusDay)[]>) => {
      action.payload.forEach(store => {
        let index = state.findIndex(storedStore => storedStore.id_store === store.id_store);
        if(index === -1) {
          // Save store
          state.push({
            // Related to information of the stores
            ...store,

            /*
            Related to the information of the stores in the context of the route.
            This configuration indicates that the store is one of the route itself.
            */
            route_day_state: store.route_day_state,
          });
        } else {
          // The store already exists. Update the information.
          state[index] = {
            ...state[index],
            ...store,
            route_day_state: store.route_day_state,
          };
        }
      });
    },
    cleanStores: (state, action: PayloadAction<void>) => {
      return [

      ];
    },
  },
});


export const { setStores, updateStores, cleanStores } = storesSlice.actions;

export default storesSlice.reducer;
