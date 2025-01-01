import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IDayOperation } from '../../interfaces/interfaces';

/*
  The intention of this context is to store the
  operations that are made throughout the day.

  This context are useful for:
  - Store what corner stores are going to be visited
  along the day.
  - Store the inventory operations that are made
  throughout the day.
  - Store "special sales" (remember that an especial
  sale is a sale to a client {corner shop} that
  doesn't to the "route day")
*/

const initialState: IDayOperation[] = [];

const dayOperationsSlice = createSlice({
  name: 'dayOperations',
  initialState,
  reducers: {
    setArrayDayOperations: (state, action: PayloadAction<IDayOperation[]>) => {
      /*
        This reducer is to store a set of day operations.
        This functions was designed to store the 'corner shops' that will be visited
        the current day.
      */

      return action.payload.map(dayOperation => {
        return {
          id_day_operation: dayOperation.id_day_operation,
          id_item: dayOperation.id_item,
          id_type_operation: dayOperation.id_type_operation,
          operation_order: dayOperation.operation_order,
          current_operation: dayOperation.current_operation,
        };
      });
    },
    setDayOperation: (state, action: PayloadAction<IDayOperation>) => {
      /* This function stores a new day operation at the end of the list of the day operations list. */
      try {
        state.push({
          id_day_operation: action.payload.id_day_operation,
          id_item: action.payload.id_item,
          id_type_operation: action.payload.id_type_operation,
          operation_order: action.payload.operation_order,
          current_operation: action.payload.current_operation,
        });
      } catch (error) {
        console.error(error);
      }
    },
    setDayOperationBeforeCurrentOperation: (state, action: PayloadAction<IDayOperation>) => {
      /*
        Opposite to "setDayOperation" which push a new operation at the end of the list
        of day operations, this function push the new operation before the current
        operation.
      */
      try {
        const newDayOperation:IDayOperation = {
          id_day_operation: action.payload.id_day_operation,
          id_item: action.payload.id_item,
          id_type_operation: action.payload.id_type_operation,
          operation_order: action.payload.operation_order,
          current_operation: action.payload.current_operation,
        };

        const index = state.findIndex(operationDay =>
          operationDay.current_operation === 1);

        if (index === -1) {
          /*
            It means that something happened to the list, so the order was lost.
            In this case the new operation is stored at the end of the list.
          */
          state.push(newDayOperation);
        } else {
          /* All is in order */
          state.splice(index, 0, newDayOperation);
        }
      } catch (error) {
        console.error(error);
      }
    },
    setNextOperation: (state, action: PayloadAction<void>) => {
      /*
        In the workflow of the application, at the beginning of the day,
        it is made a list of operations "stores to visit" that will be made by the vendor during the day.

        So this function is to mark the current operation as a done and going ahead 
        with the next one.
      */
      try {
        const index = state.findIndex(operationDay =>
          operationDay.current_operation === 1);

        if (index === -1) {
          /* Do nothing */
        } else {
          if (state.length - 1 === index) {
            /*
              The current operation is the last one of the day
            */
          } else {
            // Switching to the next operation.
            /*
              The current opeartion is not the current one any more.
            */
            state[index] = {
              ...state[index],
              current_operation: 0,
            };
            /*
              Setting the new curret operation
            */
            state[index + 1] = {
              ...state[index + 1],
              current_operation: 1,
            };
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    setCurrentOperation: (state, action: PayloadAction<IDayOperation>) => {
      /*
        This function updates to the next current day operation.

        The difference between this function and "setNextOperation" is that
        in this one you have to provide the id of the new day operation.
      */
      try {
        const id_item = action.payload.id_item;

        // Searching the index of the current day operation
        const index = state.findIndex(operationDay => operationDay.current_operation === 1);

        // Searching the index of the next "current day operation"
        const indexNextDayOperation = state.findIndex(operationDay => operationDay.id_item === id_item);

        if (index === -1) {
          /* Do nothing */
        } else {
          if (state.length - 1 === index) {
            /*
              The current operation is the last one of the day
            */
          } else {
            // Switching to the next operation.
            /*
              The current opeartion is not the current one any more.
            */
            if (indexNextDayOperation === -1) {
              /* There is not instructions; It means the next day operation doesn't exists*/
            } else {

              state[index] = {
                ...state[index],
                current_operation: 0,
              };
              /*
                Setting the new curret operation
              */
              state[indexNextDayOperation] = {
                ...state[indexNextDayOperation],
                current_operation: 1,
              };
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    },
    cleanCurrentOperationsList: (state, action: PayloadAction<void>) => {
      return [];
    },
  },
});

export const {
  setArrayDayOperations,
  setDayOperation,
  setNextOperation,
  setCurrentOperation,
  setDayOperationBeforeCurrentOperation,
  cleanCurrentOperationsList,
} = dayOperationsSlice.actions;

export default dayOperationsSlice.reducer;
