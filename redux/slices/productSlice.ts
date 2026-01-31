import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import ProductDTO from '@/src/application/dto/ProductDTO';


const productSlice = createSlice({
  name: 'product',
  initialState: null as ProductDTO[] | null,
    reducers: {
        setProducts: (state, action: PayloadAction<ProductDTO[]>) => {
            return action.payload.map(product => {
                return { ...product };
            });
        },
        clearProducts: (state) => {
            return null;
        },
    },
});

export const {
  setProducts,
  clearProducts,
} = productSlice.actions;

export default productSlice.reducer;