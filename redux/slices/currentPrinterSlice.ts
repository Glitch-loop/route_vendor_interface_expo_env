import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { BluetoothDevice } from "react-native-bluetooth-classic";

const currentPrinterSlice = createSlice({
  name: 'currentPrinterSlice',
  initialState: null as string | null,
  reducers: {
    setCurrentPrinter: (state, action: PayloadAction<string>) => {
      return action.payload
    },
    clearCurrentPrinter: (state) => {
      return null;
    }
  }
});

// export
export const { setCurrentPrinter, clearCurrentPrinter } = currentPrinterSlice.actions;
export default currentPrinterSlice.reducer;