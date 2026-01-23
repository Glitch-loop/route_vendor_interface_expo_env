import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';

/*
  Comment about the state

  This state stores the current state of the products inventory.
*/

const productsInventorySlice = createSlice({
  name: 'productsInventory',
  initialState: null as ProductInventoryDTO[] | null,
  reducers: {
    setProductInventory: (state, action: PayloadAction<ProductInventoryDTO[]>) => {
      return action.payload.map(productInventory => {
        return { ...productInventory };
      });
    },
    cleanProductInventory: (state, action: PayloadAction<void>) => {
      return null;
    },
  },
});

export const {
  setProductInventory,
  cleanProductInventory,
} = productsInventorySlice.actions;

export default productsInventorySlice.reducer;
