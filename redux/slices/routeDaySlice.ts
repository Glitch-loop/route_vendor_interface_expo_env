import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';


const routeDaySlice = createSlice({
    name: 'routeDay',
    initialState: null as RouteDayDTO | null,
    reducers: {
        setRouteDay: (state, action: PayloadAction<RouteDayDTO>) => {
            if (state !== null) {
                state.id_day = action.payload.id_day;
                state.id_route =  action.payload.id_route;
                state.id_route_day = action.payload.id_route_day;
                state.stores = action.payload.stores;
            } else { 
                return action.payload 
            };
        },
        cleanRouteDay: (state) => {
            return null;
        }
    }
});


export const { setRouteDay, cleanRouteDay } = routeDaySlice.actions;
export default routeDaySlice.reducer;