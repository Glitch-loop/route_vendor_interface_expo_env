// Redux
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// DTOs
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';

const workDayInformationSlice = createSlice({
  name: 'workDayInformation',
  initialState: null as WorkDayInformationDTO | null,
  reducers: {
    setWorkDayInformation: (state, action: PayloadAction<WorkDayInformationDTO>) => {
      return { ...action.payload }
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