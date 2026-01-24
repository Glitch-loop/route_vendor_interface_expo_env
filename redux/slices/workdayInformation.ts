// Redux
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// DTOs
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';

const workDayInformationSlice = createSlice({
  name: 'workDayInformation',
  initialState: null as WorkDayInformationDTO | null,
  reducers: {
    setWorkDayInformation: (state, action: PayloadAction<WorkDayInformationDTO>) => {
        return { 
          id_work_day: action.payload.id_work_day,
          start_date: action.payload.start_date,
          finish_date: action.payload.finish_date || null,
          start_petty_cash: action.payload.start_petty_cash,
          final_petty_cash: action.payload.final_petty_cash,
          id_route: action.payload.id_route,
          route_name: action.payload.route_name,
          description: action.payload.description,
          route_status: action.payload.route_status,
          id_day: action.payload.id_day,
          id_route_day: action.payload.id_route_day,
       }
    },
    cleanWorkDayInformation: (state) => {
      return null;
    }
  }
});

export const {
  setWorkDayInformation,
  cleanWorkDayInformation
 } = workDayInformationSlice.actions;

export default workDayInformationSlice.reducer;