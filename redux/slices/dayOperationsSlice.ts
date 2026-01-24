import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';

const dayOperationsSlice = createSlice({
  name: 'dayOperations',
  initialState: null as DayOperationDTO[] | null,
  reducers: {
    setDayOperations: (state, action: PayloadAction<DayOperationDTO[]>) => {
      return action.payload.map((operation) => ({
        id_day_operation: operation.id_day_operation,
        id_item: operation.id_item,
        operation_type: operation.operation_type,
        created_at: operation.created_at,
      }));
    },
    clenDayOperations: (state) => {
      return null;
    }
  },
});

export const {
  setDayOperations,
  clenDayOperations,
} = dayOperationsSlice.actions;

export default dayOperationsSlice.reducer;
