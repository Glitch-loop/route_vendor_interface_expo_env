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
        cleanProducts: (state, action: PayloadAction<void>) => {
            return null;
        },
    },
});

export const {
  setProducts,
  cleanProducts,
} = productSlice.actions;

export default productSlice.reducer;