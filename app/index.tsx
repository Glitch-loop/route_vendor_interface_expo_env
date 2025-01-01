// // Libraries
import React, {useEffect} from 'react';
import { AppRegistry } from 'react-native';
import { Redirect } from "expo-router";
import { Text, View } from "react-native";
import "./global.css"

// Redux context
import { Provider } from "react-redux";
import store from '../redux/store';

// import tw from 'twrnc';
// import { PaperProvider } from 'react-native-paper';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';


// import { Provider } from 'react-redux';
// import store from '../redux/store';

// // Layouts
// import RouteSelectionLayout from '../layout/RouteSelectionLayout';
// import SelectionRouteOperationLayout from '../layout/SelectionRouteOperationLayout';
// import InventoryOperationLayout from '../layout/InventoryOperationLayout';
// import RouteOperationMenuLayout from '../layout/RouteOperationMenuLayout';
// import StoreMenuLayout from '../layout/StoreMenuLayout';
// import SalesLayout from '../layout/SalesLayout';
// import LoginLayout from '../layout/LoginLayout';

// // Components
// import ToastMessage from '../components/generalComponents/ToastMessage';

// Embedded database
// Queries
import {
  createEmbeddedDatabase,
  dropEmbeddedDatabase,
 } from '../queries/SQLite/sqlLiteQueries';

// Services
import { getPrinterBluetoothConnection } from '../services/printerService';
import { requestGeolocalizationPermissionsProcess } from '../services/geolocationService';
import { createBackgroundSyncProcess } from '../services/syncService';

// export type RootStackParamList = {
//   login: undefined;
//   routeSelection: undefined;
//   selectionRouteOperation: undefined;
//   inventoryOperation: undefined;
//   routeOperationMenu: undefined;
//   storeMenu: undefined;
//   sales: undefined;
// };

async function appInitialization() {
  try {
    // Dropping database
    //console.log("deleting database")
    // await dropEmbeddedDatabase();

    // Creating database
    console.log("creating database")
    await createEmbeddedDatabase();

    //await createBackgroundSyncProcess();
    // Verifying permissions
    // Connecting to the printer
    //await getPrinterBluetoothConnection();

    // Geolocalization permissions
    await requestGeolocalizationPermissionsProcess();
  } catch (error) {
    console.log('Error: ', error);
  }
}

// const Stack = createNativeStackNavigator<RootStackParamList>();


export default function Index() {
  useEffect(() => {
    // Initializing database
    appInitialization();
  },[]);

  return (
    <Provider store={store}>
      <View>
        <Text>This is another thing</Text>
        <Redirect href="/routeSelection" />
      </View>
    </Provider>
    // <Provider store={store}>
    //   <NavigationContainer>
    //     <PaperProvider>
    //       <View style={tw`w-full h-full`}>
    //         <ToastMessage />
    //         {/* <Stack.Navigator initialRouteName="inventoryOperation"> */}
    //         <Stack.Navigator initialRouteName="login">
    //           <Stack.Screen
    //             name="login"
    //             component={LoginLayout}
    //             options={{ headerShown: false}}/>
    //           <Stack.Screen
    //             name="routeSelection"
    //             component={RouteSelectionLayout}
    //             options={{ headerShown: false}}/>
    //           <Stack.Screen
    //             name="selectionRouteOperation"
    //             component={SelectionRouteOperationLayout}
    //             options={{ headerShown: false}}/>
    //           <Stack.Screen
    //             name="inventoryOperation"
    //             component={InventoryOperationLayout}
    //             options={{  headerShown: false }} />
    //           <Stack.Screen
    //             name="routeOperationMenu"
    //             component={RouteOperationMenuLayout}
    //             options={{  headerShown: false }} />
    //           <Stack.Screen
    //             name="storeMenu"
    //             component={StoreMenuLayout}
    //             options={{  headerShown: false }} />
    //           <Stack.Screen
    //             name="sales"
    //             component={SalesLayout}
    //             options={{  headerShown: false }} />
    //         </Stack.Navigator>
    //       </View>
    //     </PaperProvider>
    //   </NavigationContainer>
    // </Provider>
  );
}
