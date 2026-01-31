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
        return {
          id_product_inventory: productInventory.id_product_inventory,
          price_at_moment: productInventory.price_at_moment,
          stock: productInventory.stock,
          id_product: productInventory.id_product,
        }
      });
    },
    clearProductInventory: (state, action: PayloadAction<void>) => {
      return null;
    },
  },
});

export const {
  setProductInventory,
  clearProductInventory,
} = productsInventorySlice.actions;

export default productsInventorySlice.reducer;
