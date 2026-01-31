import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';


const routeDaySlice = createSlice({
    name: 'routeDay',
    initialState: null as RouteDayDTO | null,
    reducers: {
        setRouteDay: (state, action: PayloadAction<RouteDayDTO>) => {
            return {
                id_day: action.payload.id_day,
                id_route:  action.payload.id_route,
                id_route_day: action.payload.id_route_day,
                stores: action.payload.stores,
            }
        },
        clearRouteDay: (state) => {
            return null;
        }
    }
});


export const { setRouteDay, clearRouteDay } = routeDaySlice.actions;
export default routeDaySlice.reducer;