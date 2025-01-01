import { Slot, Stack } from "expo-router";
import { Provider } from "react-redux";
import store from "@/redux/store";

export default function RootLayout() {
  return (
    <Provider store={store}>
      <Slot/>
    </Provider>

  )
}
