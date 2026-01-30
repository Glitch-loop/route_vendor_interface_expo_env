// Libraries
import React, {useEffect} from 'react';
import { Redirect } from "expo-router";
import "./global.css"
// import { AppRegistry } from 'react-native';
// import { Text, View } from "react-native";
// import tw from 'twrnc';

// Redux context
import { Provider } from "react-redux";
import store from '../redux/store';

// Embedded database
// Queries
import {
  createEmbeddedDatabase,
  dropEmbeddedDatabase,
  // dropUsersEmbeddedTable,
 } from '../queries/SQLite/sqlLiteQueries';

// Services
// import { getPrinterBluetoothConnection } from '../services/printerService';
// import { requestGeolocalizationPermissionsProcess } from '../services/geolocationService';
// import { createBackgroundSyncProcess } from '../services/syncService';
import { SQLiteDatabaseService } from '@/src/infrastructure/services/SQLiteDatabaseService';
import { container } from '@/src/infrastructure/di/container';
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { PaperProvider } from 'react-native-paper';
import ToastMessage from '@/components/generalComponents/ToastMessage';
import Toast from 'react-native-toast-message';
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';

// hooks
import useCurrentLocation from '@/hooks/useCurrentLocation';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { RegisterNewClientUseCase } from '@/src/application/commands/RegisterNewClientUseCase';


// TODO: Define if use  

async function appInitialization() {
  // Initializing datasource
  const sqliteDataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
  await sqliteDataSource.initialize();

  // Initializing local database
  const sqliteDatabaseService = container.resolve<LocalDatabaseService>(TOKENS.SQLiteDatabaseService);
  // await sqliteDatabaseService.dropDatabase();
  await sqliteDatabaseService.createDatabase();
  // await sqliteDatabaseService.cleanDatabase();


  // console.log("Get client: ", sqliteDataSource.getClient())

  // Initializing SQLite database
  // const dataSource = new SQLiteDataSource()
  // await dataSource.initialize();
  // const localDatabaseService = new SQLiteDatabaseService(dataSource);
  

  // Check all registered tokens
  // console.log("\n📦 Checking DI Container Registrations:");
  // Object.entries(TOKENS).forEach(([name, token]) => {
  //   const isRegistered = container.isRegistered(token);
  //   if (isRegistered) {
  //     console.log(`  ✅ ${name} - REGISTERED`);
  //   } else {
  //     console.log(`  ❌ ${name} - NOT REGISTERED`);
  //   }
  // });
  // console.log("\n");



  // About container
  // const sqliteDatabaseService = container.resolve(SQLiteDatabaseService);

  console.log("Database created successfully");

//   try {

//     // Dropping database
//     //console.log("deleting database")
//     //await dropEmbeddedDatabase()

//     //await dropUsersEmbeddedTable()
//     // Creating database
//     //console.log("creating database")
//     await createEmbeddedDatabase();

//     //await createBackgroundSyncProcess();
//     // Verifying permissions
//     // Connecting to the printer
//     //await getPrinterBluetoothConnection();

//     // Geolocalization permissions
//     // await requestGeolocalizationPermissionsProcess();
//   } catch (error) {
//     console.log('Error: ', error);
//   }
}

// const Stack = createNativeStackNavigator<RootStackParamList>();


export default function Index() {
  // const { getCurrentUserLocation } = useCurrentLocation();
  
  useEffect(() => {
    // Initializing database
    appInitialization();

    console.log("Getting current location")
    // console.log(getCurrentUserLocation())

  },[]);

  return (
    <Redirect href="/routeSelectionLayout" />
    // <Redirect href="/__testing__/component-testing/SQLite/SQLiteTestSwitch" />
  );
}
