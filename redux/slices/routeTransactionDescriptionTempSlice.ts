import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

const routeTransactionDescriptionTempSlice = createSlice({
    name: 'routeTransactionDescriptionTemp',
    initialState: null as RouteTransactionDescriptionDTO[] | null,
    reducers: {
        setRouteTransactionDescription: (state, action: PayloadAction<RouteTransactionDescriptionDTO[]>) => {
            return action.payload.map(routeTransactionDescription => {
                const { created_at } = routeTransactionDescription;

                if (created_at instanceof Date) {
                    routeTransactionDescription.created_at = created_at.toString();
                }

                return {
                    id_route_transaction_description: routeTransactionDescription.id_route_transaction_description,
                    price_at_moment: routeTransactionDescription.price_at_moment,
                    amount: routeTransactionDescription.amount,
                    created_at: routeTransactionDescription.created_at,
                    id_transaction_operation_type: routeTransactionDescription.id_transaction_operation_type,
                    id_product: routeTransactionDescription.id_product,
                    id_route_transaction: routeTransactionDescription.id_route_transaction,
                    id_product_inventory: routeTransactionDescription.id_product_inventory,
                }
            })

        },
        clearRouteTransactionDescription: (state) => {
            return null;
        }
    }
});

export const { setRouteTransactionDescription, clearRouteTransactionDescription } = routeTransactionDescriptionTempSlice.actions;
export default routeTransactionDescriptionTempSlice.reducer;
