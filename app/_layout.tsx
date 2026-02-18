// Import
// import 'reflect-metadata';
import "./global.css"

// Libraries
import React, { useEffect } from "react";
import { Slot } from "expo-router";
import { PaperProvider } from "react-native-paper";


// Redux
import { Provider } from "react-redux";
import { useRouter } from "expo-router";
import store from "@/redux/store";

// UI Components
import ToastMessage from "@/components/notifications/ToastMessage";

// Context
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <PaperProvider>
          <ToastMessage />
          <Slot/>
        </PaperProvider>
      </Provider>
    </SafeAreaProvider>
  )
}
