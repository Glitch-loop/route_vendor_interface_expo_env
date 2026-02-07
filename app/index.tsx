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
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { PaperProvider } from 'react-native-paper';
import ToastMessage from '@/components/generalComponents/ToastMessage';
import Toast from 'react-native-toast-message';
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';

// hooks
import useCurrentLocation from '@/hooks/useCurrentLocation';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { RegisterNewClientUseCase } from '@/src/application/commands/RegisterNewClientUseCase';

import { Router, useRouter } from 'expo-router';

// Use case - queries
import { container } from '@/src/infrastructure/di/container';
import RetrieveDayOperationQuery from '@/src/application/queries/RetrieveDayOperationQuery';
import ListRoutesByUserQuery from '@/src/application/queries/ListRouteByUserQuery';
import RetrieveCurrentWorkdayInformationQuery from '@/src/application/queries/RetrieveCurrentWorkdayInformationQuery';
import RetrieveCurrentShiftInventoryQuery from '@/src/application/queries/RetrieveCurrentShiftInventoryQuery';
import ListAllRegisterdStoresQuery from '@/src/application/queries/ListAllRegisterdStoresQuery';
import ListAllRegisterdProductQuery from '@/src/application/queries/ListAllRegisterdProductQuery';

// DTOs
import RouteDTO from '@/src/application/dto/RouteDTO';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';


// Redux States and reducers
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setDayOperations } from '@/redux/slices/dayOperationsSlice';
import { setWorkDayInformation } from '@/redux/slices/workdayInformation';
import { setProducts } from '@/redux/slices/productSlice';
import { setRouteDay } from '@/redux/slices/routeDaySlice';
import { setRoute } from '@/redux/slices/routeSlice';
import { setProductInventory } from '@/redux/slices/productsInventorySlice';
import { setStores } from '@/redux/slices/storesSlice';
import { setUser } from '@/redux/slices/userSlice';


async function appInitialization() {
  // Initializing datasource
  const sqliteDataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
  await sqliteDataSource.initialize();

  // Initializing local database
  const sqliteDatabaseService = container.resolve<LocalDatabaseService>(TOKENS.LocalDatabaseService);
  try {
  // await sqliteDatabaseService.dropDatabase();
  await sqliteDatabaseService.createDatabase();
  } catch (error) {
    console.log("Error during database initialization: ", error);
  }
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
  const router:Router = useRouter();
  
  // Redux
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    // Initializing database
    // appInitialization();
    startSession()
    console.log("Getting current location")
    // console.log(getCurrentUserLocation())

  },[]);


  const startSession = async () => {
    const retrieveDayOperationQuery: RetrieveDayOperationQuery = container.resolve<RetrieveDayOperationQuery>(RetrieveDayOperationQuery);
    const retrieveCurrentWorkdayInformationQuery: RetrieveCurrentWorkdayInformationQuery = container.resolve<RetrieveCurrentWorkdayInformationQuery>(RetrieveCurrentWorkdayInformationQuery);
    const retrieveCurrentShiftInventoryQuery: RetrieveCurrentShiftInventoryQuery = container.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);
    const listAllRegisterdStoresQuery: ListAllRegisterdStoresQuery = container.resolve<ListAllRegisterdStoresQuery>(ListAllRegisterdStoresQuery);
    const listAllRegisterdProductQuery: ListAllRegisterdProductQuery = container.resolve<ListAllRegisterdProductQuery>(ListAllRegisterdProductQuery);
    const getAllRoutesByUserQuery: ListRoutesByUserQuery = container.resolve<ListRoutesByUserQuery>(ListRoutesByUserQuery);

    dispatch(setUser({
      id_vendor: 'b6665f54-37de-4991-a7c4-283599bb0658',
      cellphone: '3221488795',
      name: 'Renet de Jesús Pérez Gómez de renteria abdulasis',
      password: '',
      status: 1
    }))

    try {
      const workDayInformation: WorkDayInformationDTO | null = await retrieveCurrentWorkdayInformationQuery.execute();

      
      if (workDayInformation !== null) { // A work day exists
        const dayOperations: DayOperationDTO[] = await retrieveDayOperationQuery.execute();
        const productInventory: ProductInventoryDTO[] = await retrieveCurrentShiftInventoryQuery.execute();
        const stores: StoreDTO[] = await listAllRegisterdStoresQuery.execute();
        const products: ProductDTO[] = await listAllRegisterdProductQuery.execute();

        dispatch(setWorkDayInformation(workDayInformation));
        dispatch(setProductInventory(productInventory));
        dispatch(setDayOperations(dayOperations));
        dispatch(setStores(stores));
        dispatch(setProducts(products));
      } else { // It is a new 'work' day.
        
      }
    } catch (error) {
      console.error(error);
      Toast.show({type: 'error',
        text1:'Error durante la inicialización de la aplicación.',
        text2: 'Ha habido un error durante la inicialización de la app, por favor intente nuevamente',
      });
    }
  }


  return (
    <Redirect href="/routeSelectionLayout" />
    // <Redirect href="/__testing__/component-testing/SQLite/SQLiteTestSwitch" />
  );
}
