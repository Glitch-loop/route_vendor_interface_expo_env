//Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import tw from 'twrnc';
import { ActivityIndicator } from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { Router, useRouter } from 'expo-router';

// Redux States and reducers
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { setArrayDayOperations } from '../redux/slices/dayOperationsSlice';
import {
  setDayInformation,
  setRouteInformation,
  setRouteDay,
  setAllGeneralInformation,
} from '../redux/slices/shiftInformationSlice';
import { setCurrentOperation } from '../redux/slices/currentOperationSlice';
import { setProductInventory } from '../redux/slices/productsInventorySlice';
import { setStores } from '../redux/slices/storesSlice';

// Components
import RouteSelectionCard from '../components/RouteSelectionComponents/RouteSelectionCard';
import MainMenuHeader from '../components/MainMenuHeader';
import ActionDialog from '../components/ActionDialog';

// Interfaces
import {
  ICompleteRoute,
  ICompleteRouteDay,
  IDayOperation,
  IResponse,
  IRoute,
} from '../interfaces/interfaces';

// Utils
// import DAYS from '../lib/days';
import DAYS_OPERATIONS from '../lib/day_operations';
import { getDataFromApiResponse } from '../utils/apiResponse';

// Controllers
import { getDayOperationsOfTheWorkDay } from '../controllers/DayOperationController';
import { getAvailableRoutesForTheVendor } from '../controllers/RoutesController';
import { getWorkDayFromToday } from '../controllers/WorkDayController';
import { getCurrentVendorInventory } from '../controllers/InventoryController';
import { getStoresOfTheCurrentWorkDay } from '../controllers/StoreController';


// NEW ==============================

// Use case - queries
import { ListRoutesByUserQuery } from '@/src/application/queries/ListRouteByUserQuery';
import { container } from '@/src/infrastructure/di/container';
import RouteDTO from '@/src/application/dto/RouteDTO';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';

// Utils
import { DAYS_ARRAY } from '@/src/core/constants/Days';
import { determineIfCurrentDay } from '../utils/date/momentFormat';

const routeSelectionLayout = () => {
  // Redux (context definitions)
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  // Routing
  const router:Router = useRouter();

  // Use states definition
  const [routes, setRoutes] = useState<ICompleteRoute[]|undefined>(undefined);
  const [pendingToAcceptRoute, setPendingToAcceptRoute] = useState<IRoute|undefined>(undefined);
  const [pendingToAcceptRouteDay, setPendingToAcceptRouteDay]
  = useState<ICompleteRouteDay|undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use states
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [vendorRoutes, setVendorRoutes] = useState<RouteDTO[]|null>(null);
  const [routeDaySelected, setRouteDaySelected] = useState<RouteDayDTO|null>(null);

  // Setting the current operation 'start shift inventory' (first operation of the day).
  dispatch(setCurrentOperation({
    id_day_operation: '', // Specifying that this operation belongs to this day.
    id_item: '',          // It is still not an operation.
    id_type_operation: DAYS_OPERATIONS.start_shift_inventory,
    operation_order: 0,
    current_operation: 0,
  }));


  useEffect(() => { 
    // startApplication()
    console.log('Starting session test...');
    startSession()
   },[]);

  // Auxiliar functions
  const holdRouteSelected = (routeDaySelected: RouteDayDTO) => {
    /*
      This screen is part of the start shift process of the vendor.

      Since the vendor can change from this route to other one, we store the information in
      the redux state temporarily.
    */

    // Storing information realted to the route.
    // dispatch(setRouteInformation(route));

    // Storing information related to the day
    // dispatch(setDayInformation(routeDay.day));

    //Storing information related to the relation between the route and the day.
    // dispatch(setRouteDay(routeDay));

    router.push('/selectionRouteOperationLayout');
  };

  const startApplication = () => {
    getDayOperationsOfTheWorkDay()
    .then(async (dayOperationsResponse:IResponse<IDayOperation[]>) => {
      let dayOperations:IDayOperation[] = getDataFromApiResponse(dayOperationsResponse);
      if (dayOperations.length > 0) { // A day operation exists
        /* Retrieving information of the current day. */
        Toast.show({type: 'info',
          text1:'Consultando información',
          text2: 'Recuperando la información del dia.'});

        dispatch(setAllGeneralInformation(
          getDataFromApiResponse(await getWorkDayFromToday())));

        dispatch(setArrayDayOperations(dayOperations));

        dispatch(setProductInventory(await getCurrentVendorInventory()));

        dispatch(setStores(getDataFromApiResponse(await getStoresOfTheCurrentWorkDay())));

        router.push('/routeOperationMenuLayout');
      } else {
        /* It is a new 'work' day. */
        // Getting all the routes assigned to a vendor
        Toast.show({type: 'info',
          text1:'Consultando rutas',
          text2: 'Consultando rutas disponibles para el vendedor'});

        getAvailableRoutesForTheVendor(user)
        .then((routesOfVendor:ICompleteRoute[]) => { setRoutes(routesOfVendor); })
        .catch(() => {
          Toast.show({type: 'error',
            text1:'Error durante la consulta de las rutas',
            text2: 'Ha habido un error durante la consulta de las rutas del vendedor, por favor intente nuevamente',
          });
        });
      }
    })
    .catch(() => {
      Toast.show({type: 'error',
        text1:'Error durante la recuperación de la información',
        text2: 'Ha habido un error durante la consulta de la información de las rutas, por favor intente nuevamente',
      });
    });
  }

  const startSession = async () => {
    const use_case_query = container.resolve(ListRoutesByUserQuery);
    const routes = await use_case_query.execute('b6665f54-37de-4991-a7c4-283599bb0658')
    console.log(DAYS_ARRAY)
    setVendorRoutes(routes);
  }

  //Handlers
  const handleSelectRoute = (routeDay: RouteDayDTO) => {
    // If today is not the day that corresponds, ask to route vendor if he wants to continue.
    const { id_day } = routeDay; 

    setRouteDaySelected(routeDay);

    if (determineIfCurrentDay(id_day)){
      setShowDialog(false);
      holdRouteSelected(routeDay);
    } else {
      setShowDialog(true);
    }
  };

  const handleOnAcceptMakeRoute = () => {
    if(routeDaySelected !== null) {
      holdRouteSelected(routeDaySelected);
    }
      setShowDialog(false);
      setRouteDaySelected(null);
  };

  const handleOnCancelMakeRoute = () => {
    setShowDialog(false);
    setRouteDaySelected(null);
  };

  const onRefresh = () => {
    startApplication();
    setRoutes(undefined);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);

  }

  return (
    <View style={tw`w-full h-full`}>
        <ActionDialog
          visible={showDialog}
          onAcceptDialog={handleOnAcceptMakeRoute}
          onDeclinedialog={handleOnCancelMakeRoute}>
            <View style={tw`w-11/12 flex flex-col`}>
              <Text style={tw`text-center text-black text-xl`}>
                Este dia de la ruta no corresponde hacerla hoy. ¿Estas seguro seguir adelante?
              </Text>
              <Text style={tw`my-2 text-center text-black text-xl font-bold`}>
                Ruta a hacer: {pendingToAcceptRoute?.route_name}
              </Text>
              <Text style={tw`my-2 text-center text-black text-xl font-bold`}>
                Dia: {pendingToAcceptRouteDay?.day.day_name}
              </Text>
            </View>
        </ActionDialog>
      <MainMenuHeader/>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
        {/* Show vendor's options by route in natural days order. */}
        { vendorRoutes === null ?
          <View style={tw`h-64 flex flex-col justify-center items-center`}>
            <ActivityIndicator size={'large'} />
          </View>
        :        
          vendorRoutes.length > 0 ?
          vendorRoutes.map((route:RouteDTO) => {
            return <View
              style={tw`w-full flex flex-col items-center`}
              key={route.id_route}>
                {
                  DAYS_ARRAY.map((day) => {
                    const { route_name, description } = route;
                    const { day_name } = day;
                    const routeDay = route.route_day_by_day.get(day.id_day);
                    if (routeDay === undefined) return null;

                    const {id_route_day, id_day} = routeDay;
                    return (
                    <RouteSelectionCard
                      key={id_route_day}
                      routeName={route_name}
                      day={day_name}
                      description={description}
                      routeDay={routeDay}
                      todayTurn={determineIfCurrentDay(id_day)}
                      onSelectCard={handleSelectRoute}/>
                  );
                  })
                }
            </View>;
          })
          :
          <View style={tw`h-64 flex flex-row justify-center items-center`}>
            <Text style={tw`text-2xl font-bold`}>No tienes rutas asignadas</Text>
          </View>
        }
      </ScrollView>
    </View>
  );
};

export default routeSelectionLayout;
