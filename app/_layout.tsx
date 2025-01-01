// Libraries
import { Slot, Stack } from "expo-router";
import "./global.css"

// Redux
import { Provider } from "react-redux";
import store from "@/redux/store";
import { PaperProvider } from "react-native-paper";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <PaperProvider>
        <Slot/>
      </PaperProvider>
    </Provider>

  )
}
