// Libraries
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, ScrollView, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

// Databases

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { clearDayOperations } from '@/redux/slices/dayOperationsSlice';
import { clearProductInventory } from '@/redux/slices/productsInventorySlice';
import { clearProducts } from '@/redux/slices/productSlice';
import { clearRouteDay } from '@/redux/slices/routeDaySlice';
import { clearRoute } from '@/redux/slices/routeSlice';
import { clearStores } from '@/redux/slices/storesSlice';
import { clearWorkDayInformation } from '@/redux/slices/workdayInformation';


// Services
import { deviceHasInternetConnection, syncingRecordsWithCentralDatabase } from '../services/syncService';

// UI components
import RouteCard from '@/components/route-operation-menu/RouteCard';
import MenuHeader from '@/components/shared-components/MenuHeader';
import TypeOperationItem from '@/components/route-operation-menu/TypeOperationItem';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import ProjectButton from '@/components/shared-components/ProjectButton';

// DTOs
import StoreDTO from '@/src/application/dto/StoreDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';

// Use cases and queries
import { container as di_container } from '@/src/infrastructure/di/container';
import RetrieveInventoryOperationByIDQuery from '@/src/application/queries/RetrieveInventoryOperationByIDQuery';
import DetermineCurrentInventoryOperation from '@/src/application/queries/DetermineCurrentInventoryOperation';
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';
import FinishShiftDayUseCase from '@/src/application/commands/FinishShiftDayUseCase';

// Utils
import { 
  determinePositionOrderToAttendOfStoreToAttend, 
  getTitleDayOperationForMenuOperation,
  createDayOperationDependencyMap,
  getDayOperationColor,
  orderDayOperationsForDisplaying
} from '@/utils/day-operation/utils';
import { maintainUserTable } from '../services/authenticationService';
import ActionDialog from '@/components/shared-components/ActionDialog';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';
import DataReplicationService from '@/src/infrastructure/services/DataReplicationService';
import UserDTO from '@/src/application/dto/UserDTO';


// Auxiliar functions
const doesAnActiveOperationTypeExist = async(dayOperations: DayOperationDTO[], operation_type: DAY_OPERATIONS):Promise<boolean> => {
  const productDevolutionOperationIds:string[] = [];
  let isProductDevolutionDone:boolean = false;


  // Verify if there is already an 'active' product devolution inventory.
  for (const dayOperation of dayOperations) { 
    if(dayOperation.operation_type === operation_type) {
      const { id_item } = dayOperation;
      productDevolutionOperationIds.push(id_item);
    }
  }

  const retrieveInventoryOperationQuery = di_container.resolve<RetrieveInventoryOperationByIDQuery>(RetrieveInventoryOperationByIDQuery);
  

  const productDevolutionOperations:InventoryOperationDTO[] = await retrieveInventoryOperationQuery.execute(productDevolutionOperationIds);

  for (const inventoryOperation of productDevolutionOperations) {
    const { state } = inventoryOperation;
    if (state === 1) {
      isProductDevolutionDone = true;
      break;
    }
  }

  return isProductDevolutionDone;
}

const routeOperationMenuLayout = () => {
  // Redux (context definitions)
  const dispatch:AppDispatch = useDispatch();
  const dayOperationsReduxState = useSelector((state: RootState) => state.dayOperations);
  const workdayInformationReduxState = useSelector((state: RootState) => state.workDayInformation);
  const routeDay = useSelector((state: RootState) => state.routeDay);
  const stores = useSelector((state: RootState) => state.stores);
  const user = useSelector((state: RootState) => state.user);

  // Routing
  const router:Router = useRouter();

  // States for logic of the layout
  const [isDayWorkClosed, setIsDayWorkClosed] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [currentInventoryOperation, setCurrentInventoryOperation] = useState<DayOperationDTO | null>(null);
  const [dayOperationDependencyMap, setDayOperationDependencyMap] = useState<Map<string, DayOperationDTO>>(new Map());
  const [dayOperations, setDayOperations] = useState<DayOperationDTO[]|null>(null);

  // Refs
  const operationsDayRef = useRef<Map<string, View|null>>(new Map());
  const scrolldownRef = useRef<ScrollView>(null);

  useEffect(() => {
    setUpOperationMenu();

    const backAction = () => {
      /*
        In this particular case, the "back handler" of the phone should not do anything.
        This because the "route store" becomes the new main menu of the vendor.

        This will be true until the user finishes the route of the day.
      */
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();

  }, [isDayWorkClosed, routeDay, workdayInformationReduxState]);

  useEffect(() => {
    if (currentInventoryOperation) {
      const { id_day_operation } = currentInventoryOperation;
      const operationRef = operationsDayRef.current.get(id_day_operation);
      if (operationRef) {
        operationRef.measure((fx, fy, width, height, px, py) => {
          if (scrolldownRef.current) { scrolldownRef.current.scrollTo({ y: fy }); }
        });        
      }
    }
  }, [currentInventoryOperation])

  const setUpOperationMenu = ():void => {
    if (dayOperationsReduxState !== null) {
      setDayOperationDependencyMap(createDayOperationDependencyMap([...dayOperationsReduxState]));
      setDayOperations(orderDayOperationsForDisplaying([...dayOperationsReduxState]));
    }

    if (workdayInformationReduxState === null) {
      return;
    }

    const { finish_date } = workdayInformationReduxState;
    if (finish_date === null) setIsDayWorkClosed(false); // User might make operations
    else setIsDayWorkClosed(true); // User cannot make more operations

    // Determine current inventory operation
    loadCurrentInventoryOperation();

    // Creating map of day operation dependencies

  }

  const loadCurrentInventoryOperation = async ():Promise<void> => {
    try {
      const determineCurrentQuery = di_container.resolve<DetermineCurrentInventoryOperation>(DetermineCurrentInventoryOperation);
      const currentOp = await determineCurrentQuery.execute();
      setCurrentInventoryOperation(currentOp);
    } catch (error) {
      console.log("Error loading current inventory operation: ", error);
    }
  }

  // Handlers
  const onSelectStore = (dayOperation: DayOperationDTO):void => { router.push(`/storeMenuLayout?id_store_search_param=${dayOperation.id_item}&id_day_operation_dependent_search_param=${dayOperation.id_day_operation}`); };

  const onSelectInventoryOperation = (dayOperation: DayOperationDTO):void => { router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.consult_inventory}&id_inventory_operation_search_param=${dayOperation.id_item}`); };

  const onRestockInventory = ():void => { router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.restock_inventory}`); };

  const createNewClient = ():void => { router.push('/createNewClientLayout'); };


  const onFinishInventory = async ():Promise<void> => {
    /*
      When finishing the inventory, there are two 'movements' that are needed to be done:
      - Product devolution inventory
      - Final inventory

      First the product devolution inventory must be done, then the final inventory.

      It's possible the user doesn't finish the full process, only making the product devolution, and then he nagivates to another view,
      in this case, it's needed to determine if it already exists a produdct devolution inventory and if it is, then pass directly to the final inventory.
    */

    // let isProductDevolutionDone:boolean = false;
    // const productDevolutionOperationIds:string[] = [];

    if (dayOperationsReduxState === null) {
      Toast.show({type: 'error', text1:'Error cargando operaciones del día', text2: 'Reinicia la aplicación'});
      return;
    }

    // // Verify if there is alreadu an 'active' product devolution inventory.
    // for (const dayOperation of dayOperationsReduxState) { 
    //   if(dayOperation.operation_type === DAY_OPERATIONS.product_devolution_inventory) {
    //     const { id_item } = dayOperation;
    //     productDevolutionOperationIds.push(id_item);
    //   }
    // }

    // const retrieveInventoryOperationQuery = di_container.resolve<RetrieveInventoryOperationByIDQuery>(RetrieveInventoryOperationByIDQuery);
    

    // const productDevolutionOperations:InventoryOperationDTO[] = await retrieveInventoryOperationQuery.execute(productDevolutionOperationIds);

    // for (const inventoryOperation of productDevolutionOperations) {
    //   const { state } = inventoryOperation;
    //   if (state === 1) {
    //     isProductDevolutionDone = true;
    //     break;
    //   }
    // }

    if (await doesAnActiveOperationTypeExist([ ...dayOperationsReduxState ], DAY_OPERATIONS.product_devolution_inventory)) router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.end_shift_inventory}`);
    else router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.product_devolution_inventory}`);
  };

  // Related with to the end of  the day.
  const finishWorkDay = async ():Promise<void> => {
    try {
      console.log("Finishing day")
      if (dayOperationsReduxState === null) {
        Toast.show({type: 'error', text1:'Error cargando operaciones del día', text2: 'Reinicia la aplicación'});
        return;
      }
      // Last validation for inventory operations
      if (!await doesAnActiveOperationTypeExist([ ...dayOperationsReduxState ], DAY_OPERATIONS.product_devolution_inventory)) {
        Toast.show({
          type: 'info', 
            text1:'No se puede finalizar el día sin un inventario de devolución de productos', 
            text2: 'crea el inventario de devolución de productos primero.'});
        router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.product_devolution_inventory}`);
        return;
        }
      if (!await doesAnActiveOperationTypeExist([ ...dayOperationsReduxState ], DAY_OPERATIONS.end_shift_inventory)) {
        Toast.show({
          type: 'info', 
            text1:'No se puede finalizar el día sin un inventario final.', 
            text2: 'crea el inventario final primero.'});
        router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.end_shift_inventory}`);
        return;
      }      

      const isConnected = await deviceHasInternetConnection();      
      if (!isConnected) {
        Toast.show({
          type: 'error', 
          text1: 'Sin conexión a internet',
          text2: 'Para finalizar el dia debes tener conexción a internet, o asegurate de tener datos en el celular.'
        });
        return;
      }

      Toast.show({
        type: 'info',
        text1:'Sincronizando con base de datos, por favor espere',
        text2: 'Sincronizando información con la base de datos, puede tardar unos pocos minutos.'});

      const syncingService = di_container.resolve<DataReplicationService>(DataReplicationService);
      const userSession:UserDTO = {
        id_vendor: 'b6665f54-37de-4991-a7c4-283599bb0658',
        cellphone: '',
        name: '',
        password: '',
        status: 1
      }

      await syncingService.executeReplicationSession(userSession);    
    
      const finishShiftDayUseCase = di_container.resolve<FinishShiftDayUseCase>(FinishShiftDayUseCase);

      await finishShiftDayUseCase.execute();



      // Clean redux states
      dispatch(clearDayOperations());
      dispatch(clearProductInventory());
      dispatch(clearProducts());
      dispatch(clearRouteDay());
      dispatch(clearRoute());
      dispatch(clearStores());
      dispatch(clearWorkDayInformation());

      Toast.show({
        type: 'success',
        text1:'Ruta finalizada con éxito',
        text2: ''});

      router.replace('/routeSelectionLayout');

    } catch (error) {
      console.log("Error finishing work day: ", error);
      Toast.show({
        type: 'error',
        text1:'Ha habido un error al momento de guardar la información, asegurate de tener conexión a internet para completar el proceso',
        text2: 'Ha habido un error durante el sincronizado con la base de datos.'});
    }
  };

  const onShowDialog = ():void => { setShowDialog(!showDialog); };

  const onAcceptDialog = async ():Promise<void> => {
    setShowDialog(false);
    finishWorkDay();
  };

  const onDeclinedialog = ():void => { setShowDialog(false); };

  const handlerSearchClient = ():void => { router.push('/searchClientLayout'); };

  return (
    <SafeAreaView>
      <View style={tw`w-full h-full`}>
        <ActionDialog
          visible={showDialog}
          onAcceptDialog={onAcceptDialog}
          onDeclinedialog={onDeclinedialog}>
          <View style={tw`w-full flex flex-col basis-11/12 justify-center items-center`}>
            <Text style={tw`text-center text-black text-lg`}>
              ¿Seguro que quieres regresar al menu princial?
            </Text>
            <Text style={tw`text-center text-black text-base mt-2`}>
              (Una vez aceptado no podras volver a este menú)
            </Text>
          </View>
        </ActionDialog>
        <View style={tw`flex flex-row justify-center items-center`}>
        <ProjectButton
          title={'Buscar cliente'}
          onPress={() => {
            if (isDayWorkClosed) {
              Toast.show({type: 'error', text1:'Inventario final terminado', text2: 'No se pueden hacer mas operaciones'});
            } else {
              handlerSearchClient();
            }
          }}
          buttonVariant= 'primary'
          buttonStyle={tw`w-10/12 py-4 my-2 bg-blue-400 px-4 rounded`}
        />
        </View>
        <ScrollView
          ref={scrolldownRef}
          style={tw`w-full h-full flex flex-col`}
          scrollEventThrottle={16}>
          <View style={tw`my-5`}>
            <MenuHeader
              showGoBackButton={false}
              showPrinterButton={true}
              onGoBack={() => {}}/>
          </View>
          <View style={tw`w-full flex flex-row justify-center`}>
            <View style={tw`w-11/12 flex flex-row`}>
              <TypeOperationItem />
            </View>
          </View>
          {/* List of day operations */}
          { dayOperations === null ?
            <View style={tw`h-64 flex flex-col justify-center items-center`}>
              <ActivityIndicator size={'large'} />
            </View> :
            <View style={tw`w-full h-full flex flex-col items-center`}>
              {dayOperations.map(dayOperation => {
                let itemOrder = '';
                let itemName = '';
                let description = '';
                let totalValue = '';
                let cardColor = '';
                let isClientOperation = true; /*true = client, false = inventory operation*/
                let isPrintableOperation = true;
                const { id_day_operation, id_item, operation_type } = dayOperation;

                // Inventory operations type
                cardColor = getDayOperationColor(dayOperation, dayOperationDependencyMap, false);
                if (operation_type === DAY_OPERATIONS.start_shift_inventory
                  ||  operation_type === DAY_OPERATIONS.restock_inventory
                  ||  operation_type === DAY_OPERATIONS.product_devolution_inventory
                  || operation_type === DAY_OPERATIONS.end_shift_inventory
                ) {
                  isClientOperation = false;
                  isPrintableOperation = true;
                  console.log("Type of inventory: ", getTitleDayOperationForMenuOperation(operation_type), " - id operation: ", id_item)
                  itemName = getTitleDayOperationForMenuOperation(operation_type);
                } else if (operation_type === DAY_OPERATIONS.route_client_attention
                  || operation_type === DAY_OPERATIONS.attend_client_petition
                  || operation_type === DAY_OPERATIONS.new_client_registration
                  || operation_type === DAY_OPERATIONS.attention_out_of_route
                ) {
                  isClientOperation = true;
                  isPrintableOperation = true;
                  
                  if (operation_type === DAY_OPERATIONS.route_client_attention) {
                    itemOrder = determinePositionOrderToAttendOfStoreToAttend(id_day_operation, [...dayOperations]).toString();
                  }

                  totalValue = '';
                  if (stores === null) {
                    itemName = 'Nombre cliente desconocido.';
                    description = '';
                  } else {
                    const foundStore:StoreDTO|undefined = stores.find(store => store.id_store === id_item);
                    
                    if (foundStore === undefined) {
                      itemName = 'Nombre cliente desconocido.';
                      description = '';
                    } else {
                      const { store_name, street, ext_number, colony } = foundStore;
                      itemName = store_name || 'Nombre cliente desconocido.';
                      description = street + ' #' + ext_number + ', ' + colony;
                    }                  
                  }
                } else { // Other operations
                  isPrintableOperation = false;
                }

                if(currentInventoryOperation !== null) {
                  if (id_day_operation === currentInventoryOperation.id_day_operation && currentInventoryOperation.operation_type === DAY_OPERATIONS.route_client_attention) {
                    cardColor = getDayOperationColor(dayOperation, dayOperationDependencyMap, true);
                  }

                }

                if (isPrintableOperation) {
                  return (
                    <RouteCard
                      ref = {((ref: any) => { operationsDayRef.current.set(id_day_operation, ref);})}
                      key= {id_day_operation}
                      // ref= {((ref) => { markerRefs.current[id_store] = ref; })}
                      itemOrder={itemOrder}
                      itemName={itemName}
                      description={description}
                      totalValue={totalValue}
                      style={`my-2 ${cardColor} rounded w-11/12 h-16 flex flex-row justify-center items-center text-white`}
                      onSelectItem={ isClientOperation ?
                        () => { onSelectStore(dayOperation); } :
                        () => { onSelectInventoryOperation(dayOperation); }}/>
                    );
                } else {
                  return null;
                }
              })}
            </View>
          }
          <View style={tw`h-32`}/>
        </ScrollView>
        {/* Actions menu */}
        <View style={tw`w-full absolute bottom-0 left-0 right-0 bg-amber-300 p-4 flex flex-row justify-center items-center`}>
            <ProjectButton
              title={'Crear nuevo cliente'}
              onPress={() => {
                if (isDayWorkClosed) Toast.show({type: 'error', text1:'Inventario final terminado', text2: 'No se pueden hacer mas operaciones'});
                else {
                  createNewClient();
                }
              }}
              buttonVariant='success'
              buttonStyle={tw`h-full px-4 py-3 rounded flex flex-row basis-1/3 justify-center`}/>
            <ProjectButton
              title={'Restock de producto'}
              onPress={() => {
                if (isDayWorkClosed) {
                  Toast.show({type: 'error', text1:'Inventario final finalizado', text2: 'No se pueden hacer mas operaciones'});
                } else {
                  onRestockInventory();
                }
              }}
              buttonVariant='warning'
              buttonStyle={tw`h-full px-4 py-3 mx-2 rounded flex flex-row basis-1/3 justify-center`}/>
            <ProjectButton
              title={ isDayWorkClosed ? 'Finalizar ruta' : 'Finalizar ruta' }
              onPress={() => { if (isDayWorkClosed) onShowDialog(); else onFinishInventory();}}
              buttonVariant='indigo'
              buttonStyle={tw`h-full px-4 py-3 rounded flex flex-row basis-1/3 justify-center items-center`}
            />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default routeOperationMenuLayout;

