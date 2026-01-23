import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import RouteDTO from '@/src/application/dto/RouteDTO';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';

const routeSlice = createSlice({
    name: 'route',
    initialState: null as RouteDTO | null,
    reducers: {
        setRoute: (state, action: PayloadAction<RouteDTO>) => {
            return {
                id_route: action.payload.id_route,
                route_name: action.payload.route_name,
                description: action.payload.description,
                route_status: action.payload.route_status,
                id_vendor: action.payload.id_vendor,
                route_day_by_day: null // Avoid store route days. The selected day is store in routeDaySlice.
            }
        },
        cleanRoute: (state) => {
            return null;
        }
    }
})

export const { setRoute, cleanRoute } = routeSlice.actions;
export default routeSlice.reducer;