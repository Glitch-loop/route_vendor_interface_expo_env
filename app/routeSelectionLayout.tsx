//Libraries
import React, { useEffect, useState } from 'react';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

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

// Components
import RouteSelectionCard from '@/components/RouteSelectionComponents/RouteSelectionCard';
import MainMenuHeader from '@/components/MainMenuHeader';
import ActionDialog from '@/components/ActionDialog';

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

// UI
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import Toast from 'react-native-toast-message';

// Utils
import { DAYS_ARRAY } from '@/src/core/constants/Days';
import { determineIfCurrentDay } from '../utils/date/momentFormat';

const routeSelectionLayout = () => {
  // Redux
  const dispatch: AppDispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user);

  // Routing
  const router:Router = useRouter();

  // Use states
  const [refreshing, setRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [vendorRoutes, setVendorRoutes] = useState<RouteDTO[]|null>(null);
  const [routeDaySelected, setRouteDaySelected] = useState<RouteDayDTO|undefined>(undefined);
  const [routeSelected, setRouteSelected] = useState<RouteDTO|undefined>(undefined);

  useEffect(() => { startSession() }, []);

  // Auxiliar functions
  const holdRouteSelected = (routeDaySelected: RouteDayDTO, route: RouteDTO) => {
    /*
      This screen is part of the start shift process of the vendor.

      Since the vendor can change from this route to other one, we store the information in
      the redux state temporarily.
    */

    // Store information in redux states.
    dispatch(setRouteDay(routeDaySelected));
    dispatch(setRoute({
      id_route: route.id_route,
      route_name: route.route_name,
      description: route.description,
      route_status: route.route_status,
      id_vendor: route.id_vendor,
      route_day_by_day: null,
    }));

    router.push('/selectionRouteOperationLayout');
  };

  const startSession = async () => {
    const retrieveDayOperationQuery: RetrieveDayOperationQuery = container.resolve<RetrieveDayOperationQuery>(RetrieveDayOperationQuery);
    const retrieveCurrentWorkdayInformationQuery: RetrieveCurrentWorkdayInformationQuery = container.resolve<RetrieveCurrentWorkdayInformationQuery>(RetrieveCurrentWorkdayInformationQuery);
    const retrieveCurrentShiftInventoryQuery: RetrieveCurrentShiftInventoryQuery = container.resolve<RetrieveCurrentShiftInventoryQuery>(RetrieveCurrentShiftInventoryQuery);
    const listAllRegisterdStoresQuery: ListAllRegisterdStoresQuery = container.resolve<ListAllRegisterdStoresQuery>(ListAllRegisterdStoresQuery);
    const listAllRegisterdProductQuery: ListAllRegisterdProductQuery = container.resolve<ListAllRegisterdProductQuery>(ListAllRegisterdProductQuery);
    const getAllRoutesByUserQuery: ListRoutesByUserQuery = container.resolve<ListRoutesByUserQuery>(ListRoutesByUserQuery);

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
        
        router.push('/routeOperationMenuLayout');

      } else { // It is a new 'work' day.
        const routes = await getAllRoutesByUserQuery.execute('b6665f54-37de-4991-a7c4-283599bb0658')
        setVendorRoutes(routes);
      }
    } catch {
      Toast.show({type: 'error',
        text1:'Error durante la inicialización de la aplicación.',
        text2: 'Ha habido un error durante la inicialización de la app, por favor intente nuevamente',
      });
    }

  }

  //Handlers
  const handleSelectRoute = (routeDay: RouteDayDTO) => {
    // If today is not the day that corresponds, ask to route vendor if he wants to continue.
    const { id_day, id_route } = routeDay; 

    if (vendorRoutes === null) {
      Toast.show({type: 'error',
            text1:'Error durante el proceso de selección de la ruta',
            text2: 'Recarga la pagina para continuar con el proceso.',});
      return
    }

    const route:RouteDTO|undefined = vendorRoutes.find((route:RouteDTO) => { return route.id_route === id_route });

    if (route === undefined) {
      Toast.show({type: 'error',
            text1:'Error durante el proceso de selección de la ruta',
            text2: 'Recarga la pagina para continuar con el proceso.',});
      return
    }

    setRouteDaySelected(routeDay);
    setRouteSelected(route);

    if (determineIfCurrentDay(id_day)){
      setShowDialog(false);
      holdRouteSelected(routeDay, route);
    } else setShowDialog(true);
    
  };

  const handleOnAcceptMakeRoute = () => {
    if(routeDaySelected !== undefined && routeSelected !== undefined) holdRouteSelected(routeDaySelected, routeSelected);
    setShowDialog(false);
    setRouteDaySelected(undefined);
    setRouteSelected(undefined);
  };

  const handleOnCancelMakeRoute = () => {
    setShowDialog(false);
    setRouteDaySelected(undefined);
    setRouteSelected(undefined);
  };

  const onRefresh = () => {
    startSession();
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }

  return (
    <SafeAreaView>
      <View style={tw`w-full h-full`}>
          <ActionDialog
            visible={showDialog}
            onAcceptDialog={handleOnAcceptMakeRoute}
            onDeclinedialog={handleOnCancelMakeRoute}>
              <View style={tw`w-11/12 flex flex-col`}>
                <Text style={tw`text-center text-black text-xl`}>
                  Este dia de la ruta no corresponde hacerla hoy. ¿Estas seguro seguir adelante?
                </Text>
                { routeSelected !== undefined &&
                  <Text style={tw`my-2 text-center text-black text-xl font-bold`}>
                    Ruta a hacer: {routeSelected.route_name}
                  </Text>
                }
                { routeDaySelected !== undefined &&
                <Text style={tw`my-2 text-center text-black text-xl font-bold`}>
                  Dia: { DAYS_ARRAY.find((day) => day.id_day === routeDaySelected.id_day)?.day_name || 'Nombre de dia no encontrado' }
                </Text>
                }
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
              const { id_route, route_day_by_day} = route;
              return <View
                style={tw`w-full flex flex-col items-center`}
                key={id_route}>
                  {
                    DAYS_ARRAY.map((day) => {
                      const { route_name, description } = route;
                      const { day_name } = day;

                      if (route_day_by_day === null) return null;
                      
                      const routeDay = route_day_by_day.get(day.id_day);
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
    </SafeAreaView>
  );
};

export default routeSelectionLayout;
