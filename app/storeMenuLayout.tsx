// Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Router, useLocalSearchParams, useRouter } from 'expo-router';

// Interface and enums
import {
  IRouteTransaction,
  IRouteTransactionOperation,
  IRouteTransactionOperationDescription,
  IStore,
} from '../interfaces/interfaces';

// Components
// import RouteMap from '../components/RouteMap';
import SummarizeTransaction from '../components/TransactionComponents/SummarizeTransaction';
import MenuHeader from '../components/generalComponents/MenuHeader';

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';

// Embedded database
import {
  getRouteTransactionByStore,
  getRouteTransactionOperationDescriptions,
  getRouteTransactionOperations,
} from '../queries/SQLite/sqlLiteQueries';

// Mappers and DTOs
import { container as conatiner_di } from '@/src/infrastructure/di/container';


// Utils
import Toast from 'react-native-toast-message';
import { apiResponseProcess } from '../utils/apiResponse';
import MapView, { Marker, OverlayAnimated, PROVIDER_GOOGLE } from 'react-native-maps';
import useCurrentLocation from '@/hooks/useCurrentLocation';
import RouteMap from '@/components/RouteMap';
import { capitalizeFirstLetter, capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';
import StoreDTO from '@/src/application/dto/StoreDTO';
import ListAllRegisterdStoresQuery from '@/src/application/queries/ListAllRegisterdStoresQuery';
import { setStores } from '@/redux/slices/storesSlice';
import { SafeAreaView } from 'react-native-safe-area-context';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import ListRouteTransactionsOfStoreQuery from '@/src/application/queries/ListRouteTransactionsOfStoreQuery';
import ProductDTO from '@/src/application/dto/ProductDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import { createMapProductInventoryWithProduct } from '@/utils/inventory/utils';


function buildAddress(store:StoreDTO) {
  let address = '';

  if (store.street !== ''){
    address = address + store.street + ' ';
  }

  if (store.ext_number !== ''){
    address = address + '#' + store.ext_number + '';
  }

  if (store.colony !== ''){
    address = address + ', ' + store.colony;
  }

  return address;
}

function displayingClientInformation(store:IStore) {
  let ownerStoreInformation = '';
  if ((store.owner_name !== '' && store.owner_name !== null)  && (store.cellphone !== '' && store.cellphone !== null)) {
    ownerStoreInformation = store.owner_name + ' | ' + store.cellphone;
  } else if ((store.owner_name !== ''
            && store.owner_name !== null
            && store.owner_name !== undefined) &&
            (store.cellphone === ''
            || store.owner_name === null
            || store.owner_name === undefined)) {
    ownerStoreInformation = store.owner_name;
  } else if ((store.owner_name === ''
            || store.owner_name === null
            || store.owner_name === undefined) &&
            (store.cellphone !== ''
            && store.cellphone !== null
            && store.cellphone !== undefined)){
    ownerStoreInformation = store.cellphone;
  } else {
    ownerStoreInformation = 'No disponible';
  }

  return ownerStoreInformation;
}

const INITIAL_REGION = {
  latitude: 20.641640381312676,
  longitude: -105.2190063835951,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
  zoom: 5
}

type typeSearchParams = {
  id_store_search_param: string;
}

const storeMenuLayout = () => {
  const params = useLocalSearchParams<typeSearchParams>();

  const { 
    id_store_search_param
  } = params as typeSearchParams;

  //Defining redux context
  const dispatch: AppDispatch = useDispatch();
  const stores = useSelector((state: RootState) => state.stores);
  const workDay = useSelector((state: RootState) => state.workDayInformation);
  const availableProductsReduxState = useSelector((state: RootState) => state.products);
  const productsInventoryReduxState = useSelector((state: RootState) => state.productsInventory);

  // Constants

  //Router
  const router:Router = useRouter()

  // Defining state
  const [isConsultTransaction, setIsConsultTransaction]             = useState<boolean>(false);
  const [routeTransactions, setRouteTransactions]                   = useState<RouteTransactionDTO[]>([]);
  const [routeTransactionOperations, setRouteTransactionOperations] = useState<Map<string, IRouteTransactionOperation[]>>(new Map());
  const [
    routeTransactionOperationDescriptions,
    setRouteTransactionOperationDescriptions,
  ] = useState<Map<string, IRouteTransactionOperationDescription[]>>(new Map());

  const [consultedStore, setConsultedStore] = useState<StoreDTO|null>(null)


  const [productInventoryMap, setProductInventoryMap] = useState<Map<string, ProductInventoryDTO&ProductDTO> | undefined>(undefined);

  useEffect(() => {
    // Definig only-read variables
    setUpStoreMenu();
  }, []);

  const setUpStoreMenu = async ():Promise<void> => { 
    let allStores:StoreDTO[]|null = stores;
    if (allStores === null) {
      const listAllResgisterdStores:ListAllRegisterdStoresQuery = conatiner_di.resolve<ListAllRegisterdStoresQuery>(ListAllRegisterdStoresQuery);
      allStores = await listAllResgisterdStores.execute() 
      dispatch(setStores(allStores))
    }
    
    const foundStore:StoreDTO|undefined = allStores.find(storeItem => storeItem.id_store === id_store_search_param);

    if (foundStore === undefined) {
      setConsultedStore(null);
    } else {
      setConsultedStore(foundStore);
    }

    if (availableProductsReduxState !== null && productsInventoryReduxState !== null) {
      setProductInventoryMap(createMapProductInventoryWithProduct(productsInventoryReduxState, availableProductsReduxState));
    }

  }

  // handlers
  const handlerGoBackToMainOperationMenu = () => { router.replace('/routeOperationMenuLayout') };

  const handlerGoBackToStoreMenu = () => { setIsConsultTransaction(false); };

  const handlerOnStartSale = () => { router.push(`/salesLayout?id_store_search_param=${id_store_search_param}`); };

  const handlerOnConsultTransactions = async() => {
    
    try {
      // Variables used throughout the logic of the handler
      const arrTransactions:RouteTransactionDTO[] = [];
      const mapTransactionOperations = new Map<string, IRouteTransactionOperation[]>();
      const mapTransactionOperationDescriptions = new Map<string, IRouteTransactionOperationDescription[]>();

      const settingRouteTransactionByStore:any = {
        showErrorMessage: true,
        toastTitleError: 'Error durante la consulta de las transacciones de la tienda.',
        toastMessageError: 'Ha habido un error durante la consulta, no se ha podido recuperar la información, por favor intente nuevamente',
      };
      const settingTransactionsOperation:any = {
        showErrorMessage: true,
        toastTitleError: 'Error durante la consulta de las operaciones de las trasnsacciones.',
        toastMessageError: 'Ha habido un error durante la consulta, no se ha podido recuperar la información, por favor intente nuevamente',
      };

      /* Getting all the transaciton of the store of today. */
      if (consultedStore === undefined || consultedStore === null) {
        Toast.show({type: 'error',
          text1:'Error al consultar las transacciones de la tienda',
          text2: 'Ha habido un error durante la consulta. Reinicie la aplicación e intente nuevamente.'});
        return;
      }

      const listRouteTransactionByStore: ListRouteTransactionsOfStoreQuery = conatiner_di.resolve<ListRouteTransactionsOfStoreQuery>(ListRouteTransactionsOfStoreQuery);
    
      setRouteTransactions(await listRouteTransactionByStore.execute(consultedStore));
      // setRouteTransactionOperations(mapTransactionOperations);
      // setRouteTransactionOperationDescriptions(mapTransactionOperationDescriptions);

      setIsConsultTransaction(true);

    } catch (error) {
      Toast.show({type: 'error',
        text1:'Error al consultar las ventas de la tienda',
        text2: 'Ha habido un error al intentar recuperar la información de la tienda.'});
    }
  };

  return (!isConsultTransaction ?
    // Main menu of store
    <SafeAreaView>
      <View style={tw`w-full h-full flex-col justify-center items-center`}>
        <View style={tw`w-full flex basis-1/12 my-5 flex-row justify-around items-center`}>
          {/* <MenuHeader onGoBack={handlerGoBackToMainOperationMenu}/> */}
        </View>
        { consultedStore != null &&
          <View style={tw`w-11/12 flex basis-6/12 border-solid border-2 rounded-sm`}>
            <RouteMap
              latitude={parseFloat(consultedStore.latitude)}
              longitude={parseFloat(consultedStore.longitude)}
              stores={[ consultedStore ]}
            /> 
          </View>
          // :
          // <View style={tw`w-11/12 flex justify-center items-center basis-1/2`}>
          //   <Text> No es posible mostrar el mapa debido a falta de información sobre la tienda</Text>
          // </View>
        }
        <View style={tw`w-11/12 flex basis-5/12 flex-col items-start justify-start`}>
          { consultedStore !== null &&
            <View style={tw`flex basis-1/4 flex-row justify-around items-center`}>
              <View style={tw`flex flex-col justify-around`}>
                <Text style={tw`text-black text-xl`}>Dirección</Text>
                <Text style={tw`text-black`}>{capitalizeFirstLetterOfEachWord(buildAddress(consultedStore))}</Text>
              </View>
              {/* <View style={tw`flex flex-col basis-1/2 justify-around`}>
                <Text style={[tw`text-black text-xl`, { lineHeight: 20! }]}>
                  Información del cliente
                </Text>
                <Text style={tw`text-black`}> {capitalizeFirstLetterOfEachWord(displayingClientInformation(store))} </Text>
              </View> */}
            </View>
          }
          { consultedStore !== null &&
            <View style={tw`flex basis-1/4 flex-col justify-start items-start`}>
              <Text style={tw`text-black text-xl`}>Referencia</Text>
              <Text style={tw`text-black`}>
                { consultedStore.address_reference === '' || consultedStore.address_reference === null ?
                  'No disponible' :
                  capitalizeFirstLetter(consultedStore.address_reference)
                }
              </Text>
            </View>
          }
          <View style={tw`flex basis-2/4 flex-row justify-center items-center`}>
            { productInventoryMap !== undefined &&
              <View style={tw`flex basis-1/2 justify-center items-center`}>
                <Pressable
                  style={tw`h-14 w-11/12 border-solid border bg-blue-500 
                    rounded flex flex-row justify-center items-center`}
                  onPress={() => {handlerOnConsultTransactions();}}>
                  <Text style={tw`text-center text-black`}>Transacciones de hoy</Text>
                </Pressable>
              </View>
            }
            <View style={tw`flex basis-1/2 justify-center items-center`}>
              <Pressable
                style={tw`h-14 w-11/12 bg-green-500 rounded border-solid border flex flex-row justify-center items-center`}
                onPress={() => {
                  if (workDay === null) {
                    Toast.show({type: 'error', text1:'Día de trabajo no iniciado', text2: 'No es posible iniciar una venta sin antes iniciar un día de trabajo'});
                  } else {
                    /*
                    Business rule:
                      - Once the vendor has closed his shift (end shift inventory operation),
                        he cannot start selling again until he starts a new work day.
                    */
                    const { finish_date } = workDay;
                    if (finish_date === null) handlerOnStartSale();
                    else Toast.show({type: 'error', text1:'Inventario final finalizado', text2: 'No se pueden hacer mas operaciones'});
                  }
                }}>
                <Text style={tw`text-center text-black`}>Iniciar venta</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View> 
    </SafeAreaView>
    :
    // Transaction visualization
    <SafeAreaView>
      <View style={tw`w-full h-full flex-col justify-start items-center`}>
        <View style={tw`w-full flex my-5 flex-row justify-around items-center`}>
          <MenuHeader onGoBack={handlerGoBackToStoreMenu}/>
        </View>
          { routeTransactions.length > 0 ? (
            <ScrollView showsVerticalScrollIndicator={false}>
              { routeTransactions.map(routeTransaction => {
                const { id_route_transaction } = routeTransaction;
                return (
                  <SummarizeTransaction
                    key={id_route_transaction}
                    productInventoryMap={productInventoryMap!}
                    routeTransaction={routeTransaction} />
                );
              })}
            <View style={tw`h-32`}/>
            </ScrollView>
          ) : (
            <View style={tw`w-10/12 h-full flex flex-col items-center justify-center`}>
              <Text style={tw`text-xl font-bold mb-20 text-center`}>
                Aún no hay ventas realizadas para esta tienda
              </Text>
            </View>
          )
        }
      </View>
    </SafeAreaView>
  );
};

export default storeMenuLayout;
