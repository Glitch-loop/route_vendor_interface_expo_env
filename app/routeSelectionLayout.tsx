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
} from '../redux/slices/routeDaySlice';
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
import DAYS from '../lib/days';
import { current_day_name, determineCurrentDayByDayName } from '../utils/momentFormat';
import DAYS_OPERATIONS from '../lib/day_operations';
import { getDataFromApiResponse } from '../utils/apiResponse';

// Controllers
import { getDayOperationsOfTheWorkDay } from '../controllers/DayOperationController';
import { getAvailableRoutesForTheVendor } from '../controllers/RoutesController';
import { getWorkDayFromToday } from '../controllers/WorkDayController';
import { getCurrentVendorInventory } from '../controllers/InventoryController';
import { getStoresOfTheCurrentWorkDay } from '../controllers/StoreController';

const routeSelectionLayout = () => {
  // Redux (context definitions)
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  // Routing
  const router:Router = useRouter();

  // Use states definition
  const [routes, setRoutes] = useState<ICompleteRoute[]|undefined>(undefined);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [pendingToAcceptRoute, setPendingToAcceptRoute] = useState<IRoute|undefined>(undefined);
  const [pendingToAcceptRouteDay, setPendingToAcceptRouteDay]
    = useState<ICompleteRouteDay|undefined>(undefined);
  const [refreshing, setRefreshing] = useState(false);


  // Setting the current operation 'start shift inventory' (first operation of the day).
  dispatch(setCurrentOperation({
    id_day_operation: '', // Specifying that this operation belongs to this day.
    id_item: '',          // It is still not an operation.
    id_type_operation: DAYS_OPERATIONS.start_shift_inventory,
    operation_order: 0,
    current_operation: 0,
  }));


  useEffect(() => { startApplication() },[]);

  // Auxiliar functions
  const storeRouteSelected = (route:IRoute, routeDay:ICompleteRouteDay) => {
    /*
      In this function, it is only stored information in the redux state and not in the
      embedded database, because it is not know if the vendor is going to change from one route
      to another route.
      In this way, when the vendor finishes the initial inventory process is when the route information is
      actually stored in the embedded database.
    */

    // Storing information realted to the route.
    dispatch(setRouteInformation(route));

    // Storing information related to the day
    dispatch(setDayInformation(routeDay.day));

    //Storing information related to the relation between the route and the day.
    dispatch(setRouteDay(routeDay));

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

  

  //Handlers
  const handlerOnSelectARoute = (route:IRoute, routeDay:ICompleteRouteDay) => {
    // Verifying that the selected route actually corresponds to make today.
    if (determineCurrentDayByDayName(DAYS[routeDay.id_day].day_name)){
      // The route selected is the route that corresponds to make today.
      storeRouteSelected(route, routeDay);
      setShowDialog(false);
      setPendingToAcceptRoute(undefined);
      setPendingToAcceptRouteDay(undefined);
    } else {
      // The route selectes doesn't correspond to make today.
      setShowDialog(true);
      setPendingToAcceptRoute(route);
      setPendingToAcceptRouteDay(routeDay);
    }
  };

  const handlerOnCancelMakeRoute = () => {
    setShowDialog(false);
    setPendingToAcceptRoute(undefined);
    setPendingToAcceptRouteDay(undefined);
  };

  const onRefresh = () => {
    startApplication();
    setRoutes(undefined);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);

  }

  const handlerOnAcceptMakeRoute = () => {
    if(pendingToAcceptRoute !== undefined && pendingToAcceptRouteDay !== undefined) {
      storeRouteSelected(pendingToAcceptRoute, pendingToAcceptRouteDay);
    }
      setShowDialog(false);
      setPendingToAcceptRoute(undefined);
      setPendingToAcceptRouteDay(undefined);
  };

  return (
    <View style={tw`w-full h-full`}>
        <ActionDialog
          visible={showDialog}
          onAcceptDialog={handlerOnAcceptMakeRoute}
          onDeclinedialog={handlerOnCancelMakeRoute}>
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
        { routes === undefined ?
          <View style={tw`h-64 flex flex-col justify-center items-center`}>
            <ActivityIndicator size={'large'} />
          </View>
        :        
          routes.length > 0 ?
          routes.map((route:ICompleteRoute) => {
            return <View
              style={tw`w-full flex flex-col items-center`}
              key={route.id_route}>
              { route.routeDays.map((routeDay:ICompleteRouteDay) => {
                if (routeDay.id_route === route.id_route) {
                  return (
                    <RouteSelectionCard
                      key={routeDay.id_route_day}
                      routeName={route.route_name}
                      day={routeDay.day.day_name!}
                      description={route.description}
                      route={route}
                      routeDay={routeDay}
                      onSelectCard={handlerOnSelectARoute}
                      todayTurn={determineCurrentDayByDayName(routeDay.day.day_name!)}
                      />
                  );
                }
              })}
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
