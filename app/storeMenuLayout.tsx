// Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import tw from 'twrnc';
import { Router, useLocalSearchParams, useRouter } from 'expo-router';

// Interface and enums
import {
  IRouteTransactionOperation,
  IRouteTransactionOperationDescription,
  IStore,
  IStoreRouteMap,
} from '../interfaces/interfaces';

// Components
// import RouteMap from '../components/RouteMap';
import SummarizeTransaction from '../components/TransactionComponents/SummarizeTransaction';
import MenuHeader from '../components/shared-components/MenuHeader';
import Toast from 'react-native-toast-message';
import RouteMap from '@/components/RouteMap';

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setStores } from '@/redux/slices/storesSlice';

// Mappers and DTOs
import { container as conatiner_di } from '@/src/infrastructure/di/container';
import RouteTransactionDTO from '@/src/application/dto/RouteTransactionDTO';
import ProductDTO from '@/src/application/dto/ProductDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';

// Use cases
import ListAllRegisterdStoresQuery from '@/src/application/queries/ListAllRegisterdStoresQuery';
import ListRouteTransactionsOfStoreQuery from '@/src/application/queries/ListRouteTransactionsOfStoreQuery';

// Utils
import { createMapProductInventoryWithProduct } from '@/utils/inventory/utils';


import MapView, { Marker, OverlayAnimated, PROVIDER_GOOGLE } from 'react-native-maps';
import useCurrentLocation from '@/hooks/useCurrentLocation';

import { capitalizeFirstLetter, capitalizeFirstLetterOfEachWord } from '@/utils/string/utils';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import ProjectButton from '@/components/shared-components/ProjectButton';

import { getAddressOfStore } from '@/utils/stores/utils';
import { convertStoreDTOToIStoreRouteMap } from '@/utils/stores/utils';

const INITIAL_REGION = {
  latitude: 20.641640381312676,
  longitude: -105.2190063835951,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
  zoom: 5
}

type typeSearchParams = {
  id_store_search_param: string;
  id_day_operation_dependent_search_param: string;
}

const storeMenuLayout = () => {
  const params = useLocalSearchParams<typeSearchParams>();

  const { 
    id_store_search_param,
    id_day_operation_dependent_search_param
  } = params as typeSearchParams;

  //Defining redux context
  const dispatch: AppDispatch = useDispatch();
  const stores = useSelector((state: RootState) => state.stores);
  const workDay = useSelector((state: RootState) => state.workDayInformation);
  const dayOperationsReduxState = useSelector((state: RootState) => state.dayOperations);
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

  const [consultedStore, setConsultedStore] = useState<IStoreRouteMap|null>(null)


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

    if (foundStore === undefined || dayOperationsReduxState === null) {
      setConsultedStore(null);
    } else {
      setConsultedStore(convertStoreDTOToIStoreRouteMap([foundStore], [...dayOperationsReduxState]).pop()!)
    }

    if (availableProductsReduxState !== null && productsInventoryReduxState !== null) {
      setProductInventoryMap(createMapProductInventoryWithProduct(productsInventoryReduxState, availableProductsReduxState));
    }
  }

  // handlers
  const handlerGoBackToMainOperationMenu = () => { router.replace('/routeOperationMenuLayout') };

  const handlerGoBackToStoreMenu = () => { router.replace(`/storeMenuLayout?id_store_search_param=${id_store_search_param}&id_day_operation_dependent_search_param=${id_day_operation_dependent_search_param}`); };

  const handlerOnStartSale = () => { router.push(`/salesLayout?id_store_search_param=${id_store_search_param}&id_day_operation_dependent_search_param=${id_day_operation_dependent_search_param}`); };

  const handlerOnConsultTransactions = async() => {
    
    try {
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
      <View style={tw`w-full h-full`}>
        <View style={tw`w-full flex basis-1/12 flex-row justify-center items-center`}>
          <MenuHeader 
            id_store={id_store_search_param}
            onGoBack={handlerGoBackToMainOperationMenu}/>
        </View>
        { consultedStore != null &&
          <View style={tw`w-full my-2 flex items-center justify-around`}>
            <View style={tw`w-11/12 basis-6/12 border-solid border-2 rounded-sm`}>
              <RouteMap
                stores={[ consultedStore ]}
                initialCoordinates={{ 
                    latitude: parseFloat(consultedStore.latitude) || 20.66020491403627, 
                    longitude: parseFloat(consultedStore.longitude) || -105.23041097690118 
                }}
              /> 
            </View>
          </View>
          // :
          // <View style={tw`w-full flex items-center justify-center basis-6/12 rounded-sm`}>
          //   <Text style={tw`text-black text-center`}> No es posible mostrar el mapa debido a falta de información sobre la tienda</Text>
          // </View>
        }
        <View style={tw`w-11/12 mx-2 mt-2 flex flex-col basis-5/12 flex-col items-center justify-start`}>
          { consultedStore !== null && 
          <View style={tw`w-11/12 mx-2 basis-2/4 flex flex-col justify-center items-center`}>
            <ScrollView
              persistentScrollbar={true}
              showsVerticalScrollIndicator={true}>
              <View style={tw`my-3 flex flex-col justify-start items-start`}>
                <Text style={tw`text-black text-xl`}>Dirección</Text>
                <Text style={tw`text-black`}>{capitalizeFirstLetterOfEachWord(getAddressOfStore(consultedStore))}</Text>
              </View>
              <View style={tw`flex flex-col justify-start items-start`}>
                <Text style={tw`text-black text-xl`}>Referencia</Text>
                <Text style={tw`text-black`}>
                  { consultedStore.address_reference === '' || consultedStore.address_reference === null ?
                    'No disponible' :
                    capitalizeFirstLetter(consultedStore.address_reference)
                  }
                </Text>
              </View>
          </ScrollView>
          </View>
          }
          {/* Actions band */}
          <View style={tw`w-full basis-1/4 flex flex-row justify-around items-center`}>
            { productInventoryMap !== undefined &&
              <ProjectButton 
                title='Transacciones de hoy'
                onPress={() => {handlerOnConsultTransactions();}}
                buttonVariant='primary'
                buttonStyle={tw`basis-1/3 h-3/4 rounded flex flex-row justify-center items-center`}
              />
            }
            <ProjectButton 
                title='Iniciar venta'
                onPress={() => {handlerOnStartSale();}}
                buttonVariant='success'
                buttonStyle={tw`basis-1/3 h-3/4 rounded flex flex-row justify-center items-center`}
              />
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
