// Enable dependency injection with reflection metadata
import 'reflect-metadata';

// Libraries
import { Slot, Stack } from "expo-router";
import "./global.css"

// Redux
import { Provider } from "react-redux";
import store from "@/redux/store";
import { PaperProvider } from "react-native-paper";
import ToastMessage from "@/components/generalComponents/ToastMessage";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <ToastMessage />
        <Slot/>
      </PaperProvider>
    </Provider>

  )
}
