import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';

const inventoryOperationDescriptionTempSlice = createSlice({
    name: 'inventoryOperationDescriptionTemp',
    initialState: null as InventoryOperationDescriptionDTO[] | null,
    reducers: {
        setTemporalInventoryOperationDescription: (state, action: PayloadAction<InventoryOperationDescriptionDTO[]>) => {
            return action.payload.map(inventoryOperationDescription => {
                return {
                    id_product_operation_description: inventoryOperationDescription.id_product_operation_description,
                    price_at_moment: inventoryOperationDescription.price_at_moment,
                    amount: inventoryOperationDescription.amount,
                    id_inventory_operation: inventoryOperationDescription.id_inventory_operation,
                    id_product: inventoryOperationDescription.id_product,
                }
            });
        },
        clearTemporalInventoryOperationDescription: (state) => {
            return null;
        }
    }
});

export const { setTemporalInventoryOperationDescription, clearTemporalInventoryOperationDescription } = inventoryOperationDescriptionTempSlice.actions;
export default inventoryOperationDescriptionTempSlice.reducer;