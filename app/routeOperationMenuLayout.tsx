// Libraries
import React, { useEffect, useState, useRef } from 'react';
import { BackHandler, ScrollView, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import tw from 'twrnc';
import { Router, useRouter } from 'expo-router';

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '@/redux/slices/userSlice';
import { clearRoute } from '@/redux/slices/routeSlice';
import { clearStores } from '@/redux/slices/storesSlice';
import { clearProducts } from '@/redux/slices/productSlice';
import { clearRouteDay } from '@/redux/slices/routeDaySlice';
import store, { AppDispatch, RootState } from '@/redux/store';
import { clearDayOperations } from '@/redux/slices/dayOperationsSlice';
import { clearWorkDayInformation } from '@/redux/slices/workdayInformation';
import { clearProductInventory } from '@/redux/slices/productsInventorySlice';

// UI components
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';
import MenuHeader from '@/components/shared-components/MenuHeader';
import RouteCard from '@/components/route-operation-menu/RouteCard';
import ProjectButton from '@/components/shared-components/ProjectButton';
import ActionDialog from '@/components/shared-components/ActionDialog';
import TypeOperationItem from '@/components/route-operation-menu/TypeOperationItem';

// Enums
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

// DTOs
import StoreDTO from '@/src/application/dto/StoreDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';

// Use cases and queries
import { container, container as di_container } from '@/src/infrastructure/di/container';
import FinishShiftDayUseCase from '@/src/application/commands/FinishShiftDayUseCase';
import DetermineCurrentInventoryOperation from '@/src/application/queries/DetermineCurrentInventoryOperation';
import RetrieveInventoryOperationByIDQuery from '@/src/application/queries/RetrieveInventoryOperationByIDQuery';

// Utils
import { 
  determinePositionOrderToAttendOfStoreToAttend, 
  getTitleDayOperationForMenuOperation,
  createDayOperationDependencyMap,
  getDayOperationColor,
  orderDayOperationsForDisplaying,
  getDayOperationColorByDayOperationType
} from '@/utils/day-operation/utils';


// Infrastructure
import DataReplicationService from '@/src/infrastructure/services/DataReplicationService';

// Custom hooks
import useNetworkState from '@/hooks/useNetworkState';
import SheetBackupService from '@/src/infrastructure/services/SheetBackupService';
import AuthenticationService from '@/src/infrastructure/services/AuthenticationService';
import { format_date_to_UI_format } from '@/utils/date/momentFormat';

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
  const storesRedux = useSelector((state: RootState) => state.stores);
  const userRedux = useSelector((state: RootState) => state.user);

  // Routing
  const router:Router = useRouter();

  // States for logic of the layout
  const [isDayWorkClosed, setIsDayWorkClosed] = useState<boolean>(false);
  const [wasBackupMade, setWasBackupMade] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);
  const [currentInventoryOperation, setCurrentInventoryOperation] = useState<DayOperationDTO | null>(null);
  const [dayOperationDependencyMap, setDayOperationDependencyMap] = useState<Map<string, DayOperationDTO>>(new Map());
  const [dayOperations, setDayOperations] = useState<DayOperationDTO[]|null>(null);
  
  const [clientConfirmationIds, setClientConfirmationIds] = useState<Set<string>>(new Set<string>());
  const [clientAttentionIds, setclientAttentionIds] = useState<Set<string>>(new Set<string>());
  const [clientVisitedIds, setclientVisitedIds] = useState<Set<string>>(new Set<string>());
  const [prospectOfClientIds, setProspectOfClientIds] = useState<Set<string>>(new Set<string>());

  const [propectOfClients, setProspectOfClients] = useState<StoreDTO[]|null>(null);

  // Refs
  const operationsDayRef = useRef<Map<string, View|null>>(new Map());
  const scrolldownRef = useRef<ScrollView>(null);

  // Custom hooks
  const { refreshNetworkState } = useNetworkState();

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
      dayOperationsReduxState.forEach((dayOperation) => {
        if(dayOperation.operation_type === DAY_OPERATIONS.new_client_registration) {
          setClientConfirmationIds((prev) => prev.add(dayOperation.id_item));
        } else if(dayOperation.operation_type === DAY_OPERATIONS.route_client_attention) {
          setclientAttentionIds((prev) => prev.add(dayOperation.id_item));
        } else if (dayOperation.operation_type === DAY_OPERATIONS.client_visited) {
          setclientVisitedIds((prev) => prev.add(dayOperation.id_item));
        }
      });
    }

    if (storesRedux !== null) {
      const prospectOfClientsIds: Set<string> = new Set<string>();
      const userProspectOfClients: StoreDTO[] = [];
      storesRedux.forEach((store) => {
        const { status_store, id_store } = store;

        if (status_store === -1) {
          prospectOfClientsIds.add(id_store);
          userProspectOfClients.push(store);
        }
      }); 
      setProspectOfClientIds(prospectOfClientsIds);
      setProspectOfClients(userProspectOfClients.sort((a, b) => new Date(a.creation_date).getTime() - new Date(b.creation_date).getTime()));
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
      Toast.show({type: 'error', text1:'Error cargando las operaciones del dia.', text2: 'Reinicia la aplicación'});
    }
  }

  // Handlers
  const onSelectStore = (dayOperation: DayOperationDTO):void => { router.push(`/storeMenuLayout?id_store_param=${dayOperation.id_item}&id_day_operation_dependent_param=${dayOperation.id_day_operation}`); };

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

      const isConnected = await refreshNetworkState();
      
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
      const replicationSessionResult:boolean = await syncingService.executeReplicationSession()
      if (!replicationSessionResult && !wasBackupMade) {
        Toast.show({
          type: 'error',
          text1:'Error durante la sincronizacón',
          text2: 'Descarga la información, he intenta nuevamente.'});
          return;
      }


      if (replicationSessionResult) {
        Toast.show({
          type: 'success',
          text1:'Sincronización completada exitosamente.',
          text2: 'Se han registrado todos los datos en la base de datos'});
      } else {
        Toast.show({
          type: 'info',
          text1:'Quedan pendientes datos por sincronizar.',
          text2: 'Opta por una sincronización manual usando la información descargada.'});
      }
    
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
      
      return;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1:'Ha habido un error al momento de guardar la información, asegurate de tener conexión a internet para completar el proceso',
        text2: 'Ha habido un error durante el sincronizado con la base de datos.'});
    }
  };

  const onShowDialog = async ():Promise<void> => {
    setShowDialog(!showDialog); 
  };

  const onAcceptDialog = async ():Promise<void> => {
    setShowDialog(false);
    finishWorkDay();
  };

  const onDeclinedialog = (): void => { setShowDialog(false); };

  const handlerSearchClient = ():void => { router.push('/searchClientLayout'); };

  const handleDownloadWorkDayInfo = async ():Promise<void> => {
    const sheetsBackupService = container.resolve<SheetBackupService>(SheetBackupService);

    try {
      const result = await sheetsBackupService.createBackupSheetFile();
      const destinationMessage = result.savedToDownloads
        ? 'Descargas del dispositivo.'
        : 'almacenamiento interno de la app (privado).';
      
      if (result.savedToDownloads) {
        setWasBackupMade(true);
        Toast.show({
          type: 'success',
          text1:'La descarga se ha hecho exitosamente.',
          text2: 'El archivo se guardó en ' + destinationMessage + ' Nombre: ' + result.fileName});
        } else {
        Toast.show({
          type: 'info',
          text1:'Se ha cancelado la descarga.',
          text2: 'Si quieres intentar de nuevo, da click en descargar'});
      }

    } catch (error) {
      Toast.show({
        type: 'error',
        text1:'Ha habido un error al momento de descar la información, intente nuevamente.',
        text2: ''});
    } 
  }

  const onSaleToProspectOfClient = (id_store: string): void => {
    router.push(`/storeMenuLayout?id_store_param=${id_store}&is_selling_out_of_route=1`);
    // router.push(`/salesLayout?id_store_param=${id_store}&is_selling_out_of_route=1`);
  }

  const handleLogout = async () => {
    const authenticationService = container.resolve(AuthenticationService);
    await authenticationService.logoutUser();
    dispatch(logoutUser(null));
    router.replace('/loginLayout');
  }

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
        <View style={tw`flex flex-row justify-around items-center`}>
          { isDayWorkClosed ?
            <ProjectButton
              title={'Descargar'}
              onPress={() => { handleDownloadWorkDayInfo(); }}
              buttonVariant= 'neutral'
              buttonStyle={tw`flex basis-3/8 py-4 my-2 bg-blue-400 px-4 rounded`}
            /> 
            :
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
              buttonStyle={tw`flex ${isDayWorkClosed ? `basis-4/8` : `basis-4/8`} py-4 my-2 bg-blue-400 px-4 rounded`}
            />
          }
          <ProjectButton
              title='Cerrar sesión'
              onPress={() => { handleLogout()}}
              buttonVariant='neutral'
              textStyle='text-gray-800'
              buttonStyle={tw`px-4 py-4 rounded`}
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
            <View style={tw`w-full flex flex-col items-center`}>
              { dayOperations.map(dayOperation => {
                let itemOrder = '';
                let itemName = '';
                let description = '';
                let totalValue = '';
                let cardColor = '';
                let isClientOperation = true; /*true = client, false = inventory operation*/
                let isPrintableOperation = true;
                const { id_day_operation, id_item, operation_type } = dayOperation;

                // Determining color of the card.
                if(operation_type === DAY_OPERATIONS.route_client_attention
                || operation_type === DAY_OPERATIONS.attend_client_petition
                || operation_type === DAY_OPERATIONS.new_client_registration
                || operation_type === DAY_OPERATIONS.attention_out_of_route
                || operation_type === DAY_OPERATIONS.prospect_registration
                ) { // Operation client
                  /*
                    Design note (07-17-26)

                    The order of the if-else statements matters.

                    If clientAttentionIds.has(id_item) && clientVisitedIds.has(id_item) is moved up, there is 
                    the possibility of get a true for that case when it should be another block statement.
                  */
                   if(prospectOfClientIds.has(id_item)) {
                    cardColor = getDayOperationColorByDayOperationType(DAY_OPERATIONS.prospect_registration, false);                    
                  } else if (clientConfirmationIds.has(id_item)) {
                    cardColor = getDayOperationColorByDayOperationType(DAY_OPERATIONS.new_client_registration, false);  
                  } else if (clientAttentionIds.has(id_item) && clientVisitedIds.has(id_item)) {
                    cardColor = getDayOperationColorByDayOperationType(DAY_OPERATIONS.client_visited, false);  
                  } else {
                    cardColor = getDayOperationColorByDayOperationType(operation_type, false);
                  }
                } else { // Other type of operations
                  cardColor = getDayOperationColorByDayOperationType(operation_type, false);
                }

                if (currentInventoryOperation !== null) {
                  if (id_day_operation === currentInventoryOperation.id_day_operation && currentInventoryOperation.operation_type === DAY_OPERATIONS.route_client_attention) {
                    cardColor = getDayOperationColor(dayOperation, dayOperationDependencyMap, true);
                  }
                }
                
                // Determining type of operation and if it is printable.
                if (operation_type === DAY_OPERATIONS.start_shift_inventory
                  || operation_type === DAY_OPERATIONS.restock_inventory
                  || operation_type === DAY_OPERATIONS.product_devolution_inventory
                  || operation_type === DAY_OPERATIONS.end_shift_inventory
                ) {
                  isClientOperation = false;
                  isPrintableOperation = true;
                  itemName = getTitleDayOperationForMenuOperation(operation_type);
                } else if (operation_type === DAY_OPERATIONS.route_client_attention
                  || operation_type === DAY_OPERATIONS.attend_client_petition
                  || operation_type === DAY_OPERATIONS.new_client_registration
                  || operation_type === DAY_OPERATIONS.attention_out_of_route
                  || operation_type === DAY_OPERATIONS.prospect_registration
                ) {
                  isClientOperation = true;
                  isPrintableOperation = true;
                  
                  if (operation_type === DAY_OPERATIONS.route_client_attention) {
                    itemOrder = determinePositionOrderToAttendOfStoreToAttend(id_day_operation, [...dayOperations]).toString();
                    if(clientConfirmationIds.has(id_item)) isPrintableOperation = false;
                  } else if (operation_type === DAY_OPERATIONS.attention_out_of_route) {
                    /*
                      Note (07-14-26)

                      When new client is confirmed, and it was confirmed through a selling
                      out of route, then an operation of this type will be created, 
                      for avoiding user's confusion, if it is a new client confirmation
                      day operation for a store with attention out of route this will be 
                      set as not printable, letting the new client registration as
                      the unique possible way for printing.
                    */
                    if(clientConfirmationIds.has(id_item)) isPrintableOperation = false;
                  } else if(operation_type === DAY_OPERATIONS.new_client_registration) {
                    if (clientAttentionIds.has(id_day_operation))
                      itemOrder = determinePositionOrderToAttendOfStoreToAttend(id_day_operation, [...dayOperations]).toString();
                  }

                  totalValue = '';
                  if (storesRedux === null) {
                    itemName = 'Nombre cliente desconocido.';
                    description = '';
                  } else {
                    const foundStore:StoreDTO|undefined = storesRedux.find(store => store.id_store === id_item);
                    
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
          {/* List of vendor's prospect of clients */}
          <View style={tw`mt-3 w-full flex flex-row justify-center`}>
            <Text style={tw`text-xl text-black align-middle`}>Prospectos de cliente</Text>
          </View>
          { propectOfClients === null ?
          <View style={tw`h-64 flex flex-col justify-center items-center`}>
            <ActivityIndicator size={'large'} />
          </View> 
          :
          <View style={tw`w-full h-full flex flex-col items-center`}>
            { propectOfClients.length === 0 || userRedux === null ?
              <View style={tw`h-64 flex flex-col justify-center items-center`}>
                <Text style={tw`text-xl text-black align-middle`}>Actualmente no tienes prospectos</Text>
              </View> 
              : 
              <View style={tw`w-full h-full flex flex-col items-center`}>
              {propectOfClients.map(storeRedux => {
                let itemOrder = '';
                let itemName = '';
                let description = '';
                let totalValue = '';
                const { id_store, status_store, store_name, street, ext_number, colony, id_creator, creation_date } = storeRedux;
                const { id_vendor } = userRedux;

                itemName = store_name || 'Nombre cliente desconocido.';
                description = street + ' #' + ext_number + ', ' + colony + ' - Creado: ' + format_date_to_UI_format(creation_date);
                
                if (status_store === -1 && id_vendor === id_creator) {
                  return (
                    <RouteCard
                      // ref = {((ref: any) => { operationsDayRef.current.set(id_day_operation, ref);})}
                      key= {id_store}
                      // ref= {((ref) => { markerRefs.current[id_store] = ref; })}
                      itemOrder={itemOrder}
                      itemName={itemName}
                      description={description}
                      totalValue={totalValue}
                      style={`my-2 bg-green-400 rounded w-11/12 h-16 flex flex-row justify-center items-center text-white`}
                      onSelectItem={() => { onSaleToProspectOfClient(id_store); }}
                      />
                    );
                } else {
                  return null;
                }
              })}
              </View>
            }
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
              onPress={() => { if (isDayWorkClosed) onShowDialog(); else onFinishInventory(); }}
              buttonVariant='indigo'
              buttonStyle={tw`h-full px-4 py-3 rounded flex flex-row basis-1/3 justify-center items-center`}
            />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default routeOperationMenuLayout;

