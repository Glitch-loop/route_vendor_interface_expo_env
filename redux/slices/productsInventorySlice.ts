import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IProductInventory } from '../../interfaces/interfaces';


/*
  Comment about the state

  This state stores the current inventory.
*/

const initialState: IProductInventory[] = [];

const productsInventorySlice = createSlice({
  name: 'productsInventory',
  initialState,
  reducers: {
    setProductInventory: (state, action: PayloadAction<IProductInventory[]>) => {
      return action.payload.map(productInventory => ({
          id_product: productInventory.id_product,
          product_name: productInventory.product_name,
          barcode: productInventory.barcode,
          weight: productInventory.weight,
          unit: productInventory.unit,
          comission: productInventory.comission,
          price: productInventory.price,
          product_status: productInventory.product_status,
          amount: productInventory.amount,
          order_to_show: productInventory.order_to_show,
        }));
    },
    addProductsInventory: (state, action: PayloadAction<IProductInventory[]>) => {
      const newInventory:IProductInventory[] = [];
      const totalProductsToAdd:number = action.payload.length;
      
      for (let i = 0; i < totalProductsToAdd; i++) {
        const foundProductInState:undefined|IProductInventory = state
          .find((currentProductInState) => {return currentProductInState.id_product === action.payload[i].id_product;});

          if(foundProductInState === undefined) {
          newInventory.push({
            ...action.payload[i]
          })
        } else {
          newInventory.push({
            ...foundProductInState,
            amount: action.payload[i].amount + foundProductInState.amount,
          })
        }
      }
      console.log("Updating state++++++++++++++++++++++++++++++++++++++++")
      newInventory.forEach((item) => console.log("Product name: ", item.product_name, " - amount to add: ", item.amount))
      return newInventory;
    },
    updateProductsInventory: (state, action: PayloadAction<IProductInventory[]>) => {
      const totalProductsToUpdate:number = action.payload.length;
      
      for (let i = 0; i < totalProductsToUpdate; i++) {
        const foundProductInStateIndex:undefined|number = state
          .findIndex((currentProductInState) => {return currentProductInState.id_product === action.payload[i].id_product;});

          if(foundProductInStateIndex === -1) {
          state.push({
            ...action.payload[i]
          })
        } else {
          state[foundProductInStateIndex] = {
            ...action.payload[i]
          }
        }
      }
    },
    cleanProductsInventory: (state, action: PayloadAction<void>) => {
      return [

      ];
    },
  },
});

export const {
  setProductInventory,
  addProductsInventory,
  updateProductsInventory,
  cleanProductsInventory,
} = productsInventorySlice.actions;

export default productsInventorySlice.reducer;
