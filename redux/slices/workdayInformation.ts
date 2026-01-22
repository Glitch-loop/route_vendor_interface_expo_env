import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { WorkDayInformationDTO } from '@/src/application/dto/WorkDayInformationDTO';


const workDayInformationSlice = createSlice({
  name: 'workDayInformation',
  initialState: null as WorkDayInformationDTO | null,
  reducers: {
    setWorkDayInformation: (state, action: PayloadAction<WorkDayInformationDTO>) => {

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