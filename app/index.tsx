// // Libraries
import React, {useEffect} from 'react';
import { AppRegistry } from 'react-native';
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import "./global.css"
import tw from 'twrnc';

// Redux context
import { Provider } from "react-redux";
import store from '../redux/store';

// Embedded database
// Queries
import {
  createEmbeddedDatabase,
  dropEmbeddedDatabase,
  dropUsersEmbeddedTable,
 } from '../queries/SQLite/sqlLiteQueries';

// Services
import { getPrinterBluetoothConnection } from '../services/printerService';
// import { requestGeolocalizationPermissionsProcess } from '../services/geolocationService';
import { createBackgroundSyncProcess } from '../services/syncService';
import { PaperProvider } from 'react-native-paper';
import ToastMessage from '@/components/generalComponents/ToastMessage';
import Toast from 'react-native-toast-message';

// hooks
import useCurrentLocation from '@/hooks/useCurrentLocation';

async function appInitialization() {

  
  try {

    // Dropping database
    //console.log("deleting database")
    //await dropEmbeddedDatabase()

    //await dropUsersEmbeddedTable()
    // Creating database
    console.log("creating database")
    await createEmbeddedDatabase();

    //await createBackgroundSyncProcess();
    // Verifying permissions
    // Connecting to the printer

    //await getPrinterBluetoothConnection();

    // Geolocalization permissions
    // await requestGeolocalizationPermissionsProcess();
  } catch (error) {
    console.log('Error: ', error);
  }
}

// const Stack = createNativeStackNavigator<RootStackParamList>();


export default function Index() {
  const { getCurrentUserLocation } = useCurrentLocation();
  
  useEffect(() => {
    // Initializing database
    appInitialization();

    console.log("Getting current location")
    console.log(getCurrentUserLocation())

  },[]);

  return (
    <Redirect href="/loginLayout" />
  );
}
