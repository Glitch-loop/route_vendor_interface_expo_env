// Libraries
import React, { use, useEffect, useState } from 'react';
import { BackHandler, ScrollView, View, Pressable } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import tw from 'twrnc';
import { Router, useRouter, useLocalSearchParams } from 'expo-router';

// Databases
// Embedded
import {
  cleanEmbeddedDatbase,
} from '../queries/SQLite/sqlLiteQueries';

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import {
  cleanCurrentOperation,
  setCurrentOperation,
} from '../redux/slices/currentOperationSlice';
import { cleanCurrentOperationsList } from '../redux/slices/dayOperationsSlice';
import { cleanProductsInventory } from '../redux/slices/productsInventorySlice';
import { cleanAllGeneralInformation } from '../redux/slices/workdayInformation';
import { cleanStores } from '../redux/slices/storesSlice';

// Services
import { deviceHasInternetConnection, syncingRecordsWithCentralDatabase } from '../services/syncService';

// Components
import RouteCard from '../components/RouteCard';
import MenuHeader from '../components/generalComponents/MenuHeader';
import TypeOperationItem from '../components/TypeOperationItem';

// Interfaces and enums
import { IDayOperation, IResponse } from '../interfaces/interfaces';

// Utils
import { getStyleDayOperationForMenuOperation, getTitleDayOperationForMenuOperation } from '@/utils/day-operation/utils';
import { apiResponseStatus } from '../utils/apiResponse';
import { getColorContextOfStore } from '../utils/routesFunctions';
import DAYS_OPERATIONS from '../lib/day_operations';
import ActionDialog from '../components/ActionDialog';
import { maintainUserTable } from '../services/authenticationService';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

// UI
import { SafeAreaView } from 'react-native-safe-area-context';

// DTOs
import StoreDTO from '@/src/application/dto/StoreDTO';
import Toast from 'react-native-toast-message';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';

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

  }, [isDayWorkClosed, routeDay]);

  const setUpOperationMenu = ():void => {
    if (workdayInformationReduxState === null) {
      Toast.show({type: 'error', text1:'Error cargando operaciones del día', text2: 'Intenta reiniciar la aplicación'});
      return;
    }
    const { finish_date } = workdayInformationReduxState;
    if (finish_date === null) setIsDayWorkClosed(false); // User might make operations
    else setIsDayWorkClosed(true); // User cannot make more operations
  }

  // Handlers
  const onSelectStore = (dayOperation: DayOperationDTO):void => { router.push(`/storeMenuLayout?id_store_search_param=${dayOperation.id_item}`); };

  const onSelectInventoryOperation = (dayOperation: DayOperationDTO):void => { router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.consult_inventory}&id_inventory_operation_search_param=${dayOperation.id_item}`); };

  const onRestockInventory = ():void => { router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.restock_inventory}`); };

  const onFinishInventory = ():void => {
    /*
      There are two operations to make at the end of the day:
      1 - product devolution inventory.
      2 - final inventory (remaining product).

      The complete process for finishing work day is first making the product devolution and then
      making the final inventory.
    */
    let mustBeCompleteProcess:boolean = true;
    // Determining if there is already an product devolution, if it is, then skip it
    dayOperations.forEach((dayOperation) => {
      if(dayOperation.id_type_operation === DAYS_OPERATIONS.product_devolution_inventory) {
        mustBeCompleteProcess = false;
      }
    });

    if (mustBeCompleteProcess) {
      dispatch(setCurrentOperation({
        id_day_operation: routeDay.id_route_day, // Specifying that this operation belongs to this day.
        id_item: '', // It is still not an operation.
        id_type_operation: DAYS_OPERATIONS.product_devolution_inventory,
        operation_order: 0,
        current_operation: 0,
      }));
    } else {
      dispatch(setCurrentOperation({
        id_day_operation: routeDay.id_route_day, // Specifying that this operation belongs to this day.
        id_item: '', // It is still not an operation.
        id_type_operation: DAYS_OPERATIONS.end_shift_inventory,
        operation_order: 0,
        current_operation: 0,
      }));
    }
    router.push('/inventoryOperationLayout');
  };

  // Related with to the end of  the day.
  const finishWorkDay = async ():Promise<void> => {
    try {
      console.log("Finishing day")
      
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

      // Storing the information in the main database.
      const resultSyncingProcess:boolean = await syncingRecordsWithCentralDatabase(true);

      /* The user only will be capable to finish the day if all the records were correctly
      synchronized with the database. */
      if (resultSyncingProcess) {
        Toast.show({
          type: 'success',
          text1:'Se ha guardado toda la inforamción correctamente',
          text2: 'Se ha sincronizado toda la información correctamente con la base de datos.'});

        // Clean data of database.
        const resultCleanDatabase:IResponse<null> = await cleanEmbeddedDatbase();

        // Creating database with new information (not necessary).
        // await dropEmbeddedDatabase();
        // const resultCreateDatabase:IResponse<null> = await createEmbeddedDatabase();

        // Maintaining user's table
        const resultMaintainUsersTable:IResponse<null> = await maintainUserTable(user);

        if(apiResponseStatus(resultCleanDatabase, 200)
        // && apiResponseStatus(resultCreateDatabase, 201)
        && apiResponseStatus(resultMaintainUsersTable, 200)) {
          // Clean states
          cleanCurrentOperation();
          cleanCurrentOperationsList();
          cleanProductsInventory();
          cleanAllGeneralInformation();
          cleanStores();

          // Resetting the navigation stack (avoiding user go back to the route operation).
          // navigation.reset({
          //   index: 0, // Set the index of the new state (0 means first screen)
          //   routes: [{ name: 'routeSelection' }], // Array of route objects, with the route to navigate to
          // });
          // navigation.navigate('routeSelection');

          // Redirecting to main menu.
          router.replace('/routeSelectionLayout');
        } else {
          /* Something was wrong*/
          Toast.show({
            type: 'error',
            text1:'Ha habido un error al momento de guardar la información, asegurate de tener conexión a internet para completar el proceso',
            text2: 'Ha habido un error durante el sincronizado con la base de datos.'});
        }
      } else {
        Toast.show({
          type: 'error',
          text1:'Ha habido un error al momento de guardar la información, asegurate de tener conexión a internet para completar el proceso',
          text2: 'Ha habido un error durante el sincronizado con la base de datos.'});
      }
    } catch (error) {
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
        <Pressable
          onPress={() => {
            if (isDayWorkClosed) {
              Toast.show({type: 'error', text1:'Inventario final terminado', text2: 'No se pueden hacer mas operaciones'});
            } else {
              handlerSearchClient();
            }
          }}
          style={tw`w-10/12 py-4 my-2 bg-blue-400 px-4 rounded`}>
          <Text style={tw`text-sm text-center`}>Buscar cliente</Text>
        </Pressable>
        </View>
        <ScrollView
          style={tw`w-full h-full flex flex-col`}
          scrollEventThrottle={16}>
          <View style={tw`my-5`}>
            <MenuHeader
              showGoBackButton={false}
              showStoreName={false}
              showPrinterButton={true}
              onGoBack={() => {}}/>
          </View>
          <View style={tw`w-full flex flex-row justify-center`}>
            <View style={tw`w-11/12 flex flex-row justify-start`}>
              <TypeOperationItem />
            </View>
          </View>
          {/* List of day operations */}
          { dayOperationsReduxState === null ?
            <View style={tw`h-64 flex flex-col justify-center items-center`}>
              <ActivityIndicator size={'large'} />
            </View> :
            <View style={tw`w-full h-full flex flex-col items-center`}>
              {dayOperationsReduxState.map(dayOperation => {
                let itemOrder = '';
                let itemName = '';
                let description = '';
                let totalValue = '';
                let style = '';
                let isClientOperation = true; /*true = client, false = inventory operation*/
                let isPrintableOperation = true;
                const { id_day_operation, id_item, operation_type, created_at } = dayOperation;


                // Inventory operations type
                style = getStyleDayOperationForMenuOperation(operation_type);
                
                if (operation_type === DAY_OPERATIONS.start_shift_inventory
                  ||  operation_type === DAY_OPERATIONS.restock_inventory
                  ||  operation_type === DAY_OPERATIONS.product_devolution_inventory
                  || operation_type === DAY_OPERATIONS.end_shift_inventory
                ) {
                  isClientOperation = false;
                  isPrintableOperation = true;
                  itemName = getTitleDayOperationForMenuOperation(operation_type);
                } else if (operation_type === DAY_OPERATIONS.route_client_attention
                  || operation_type === DAY_OPERATIONS.attend_client_petition
                  || operation_type === DAY_OPERATIONS.new_client_registration
                  || operation_type === DAY_OPERATIONS.attention_out_of_route
                ) {
                  isClientOperation = true;
                  isPrintableOperation = true;
                  
                  itemOrder = '0'
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

                if (isPrintableOperation) {
                  return (
                    <RouteCard
                      key={dayOperation.id_day_operation}
                      itemOrder={itemOrder}
                      itemName={itemName}
                      description={description}
                      totalValue={totalValue}
                      style={style}
                      onSelectItem={ isClientOperation ?
                        () => { onSelectStore(dayOperation); } :
                        () => { onSelectInventoryOperation(dayOperation); }}/>
                    );
                } else {
                  console.log("Operation not printable");
                  return null;
                }
              })}
            </View>
          }
          <View style={tw`h-32`}/>
        </ScrollView>
        {/* Actions menu */}
        <View style={tw`w-full
          absolute mb-3 bottom-0 left-0 right-0 bg-amber-300 p-4
          flex flex-row justify-around
          `}>
            <Pressable
              onPress={() => {
                if (isDayWorkClosed) {
                  Toast.show({type: 'error', text1:'Inventario final terminado', text2: 'No se pueden hacer mas operaciones'});
                } else {
                  // createNewClient();
                }
              }}
              style={tw`bg-green-500 px-4 py-3 rounded flex flex-row basis-1/3 justify-center`}>
              <Text style={tw`text-sm text-center`}>Crear nuevo cliente</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (isDayWorkClosed) {
                  Toast.show({type: 'error', text1:'Inventario final finalizado', text2: 'No se pueden hacer mas operaciones'});
                } else {
                  onRestockInventory();
                }
              }}

              // style={tw`bg-orange-500 px-4 py-3 mx-1 rounded flex flex-row basis-1/3 justify-center`}
            
                // android_ripple={{ color: tw.color('orange-700'), borderless: false }}
                style={({ pressed }) =>
                  tw.style(
                    'px-4 py-3 mx-1 rounded flex flex-row basis-1/3 justify-center bg-orange-500',
                    pressed ? tw.color('bg-orange-600') : tw.color('bg-orange-500') 
                  )
                }
              >
              <Text style={tw`text-sm text-center`}>Restock de producto</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (isDayWorkClosed) {
                  onShowDialog();
                } else {
                  onFinishInventory();
                }
              }}
              style={tw`bg-indigo-400 px-4 py-3 rounded flex flex-row basis-1/3 justify-center`}>
              <Text style={tw`text-sm text-center`}>
                { isDayWorkClosed ? 'Finalizar ruta' : 'Finalizar ruta' }
              </Text>
            </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default routeOperationMenuLayout;

