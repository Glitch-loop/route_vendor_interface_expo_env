// Import first
import "./global.css"

// Libraries
import React, {useEffect} from 'react';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';
import { View } from 'react-native';

// Services

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

// UI components
import { PaperProvider, Text } from 'react-native-paper';
import ToastMessage from '@/components/notifications/ToastMessage';
import Toast from 'react-native-toast-message';

// Interfaces
import { LocalDatabaseService } from '@/src/core/interfaces/LocalDatabaseService';

// hooks
import useCurrentLocation from '@/hooks/useCurrentLocation';
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';
import { RegisterNewClientUseCase } from '@/src/application/commands/RegisterNewClientUseCase';


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
import AuthenticationService from "@/src/infrastructure/services/AuthenticationService";
import UserDTO from "@/src/application/dto/UserDTO";


async function localDatabaseInitialization() {
  // console.log("Initializing local database...");
  // Initializing datasource
  const sqliteDataSource = container.resolve<SQLiteDataSource>(TOKENS.SQLiteDataSource);
  await sqliteDataSource.initialize();

  // Initializing local database
  const sqliteDatabaseService = container.resolve<LocalDatabaseService>(TOKENS.LocalDatabaseService);
  try {
    // console.log("Dropping database")
    await sqliteDatabaseService.dropDatabase();
    // console.log("Creating database")
    await sqliteDatabaseService.createDatabase();
  } catch (error) {
    // console.log("Error during database initialization: ", error);
  }
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
    // console.log("index.tsx")
    startSession()
  },[]);


  const startSession = async () => {
    const authenticationService = container.resolve(AuthenticationService);
    await localDatabaseInitialization();
    const userSession:UserDTO | null = await authenticationService.activeSession();

    if (userSession === null) {
      router.replace('/loginLayout');
      return;
    } else {
      dispatch(setUser(userSession));
      router.replace('/routeSelectionLayout');
    }    
  }


  return (
    // <Redirect href="/routeSelectionLayout" />
    // <Redirect href="/loginLayout" />
    <View
      // onTouchEnd={() => { console.log("asas") }} 
      style={tw`flex-1 justify-center items-center`}>
      <Text style={tw`text-lg`}>Iniciando la aplicación</Text>
      {/* <Redirect href="/loginLayout" /> */}
    </View>
    // <Redirect href="/__testing__/component-testing/SQLite/SQLiteTestSwitch" />
  );
}
