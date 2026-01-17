// Import
// import 'reflect-metadata';
import "./global.css"

// Libraries
import React, { useEffect } from "react";
import { Slot, Stack } from "expo-router";

// Interaces
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';

// Di container
import { container as diContainer } from '@/src/infrastructure/di/container';

// Datasources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Infrastructure: services
import { SQLiteDatabaseService } from '@/src/infrastructure/services/SQLiteDatabaseService';

// Redux
import { Provider } from "react-redux";
import store from "@/redux/store";
import { PaperProvider } from "react-native-paper";
import ToastMessage from "@/components/generalComponents/ToastMessage";
import { TOKENS } from "@/src/infrastructure/di/tokens";

async function appSetUp() {
    console.log("Rootlayout Initialization started");
    // const sqliteDataSource: SQLiteDataSource = diContainer.resolve(TOKENS.SQLiteDataSource);
    // await sqliteDataSource.initialize(); // Starting local database

    // const sqliteDatabaseService = diContainer.resolve<LocalDatabaseService>(TOKENS.SQLiteDatabaseService);
    // // const sqliteDatabaseService1 = container.resolve<LocalDatabaseService>(TOKENS.SQLiteDatabaseService);
    // await sqliteDatabaseService.createDatabase();

    // const sqliteDatabaseService: LocalDatabaseService = diContainer.resolve(SQLiteDatabaseService);
    // sqliteDatabaseService.createDatabase(); // Creating embedded database tables
};

export default function RootLayout() {
  useEffect(() => {
    appSetUp();

  }, [])
  return (
    <Provider store={store}>
      <PaperProvider>
        <ToastMessage />
        <Slot/>
      </PaperProvider>
    </Provider>

  )
}
