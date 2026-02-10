// Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { router } from 'expo-router';
import { LocationObject } from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { setCurrentOperation } from '@/redux/slices/currentOperationSlice';

// Hooks
import useCurrentLocation from '@/hooks/useCurrentLocation';

// Interfaces
import { IDayOperation, IStore, IStoreStatusDay, IStoreRouteMap } from '@/interfaces/interfaces';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';

// Utils
import { distanceBetweenTwoPoints } from '@/utils/routesFunctions';
// import DAYS_OPERATIONS from '@/lib/day_operations';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

// Controllers
import { createDayOperationConcept } from '@/controllers/DayOperationController';

// UI - Components
import RouteMap from '@/components/RouteMap';
import SearchBarWithSuggestions from '@/components/SalesLayout/SearchBarWithSuggestions';
import ConfirmationBand from '@/components/shared-components/ConfirmationBand';
import RouteHeader from '@/components/shared-components/RouteHeader';
import Toast from 'react-native-toast-message';
import StoreDTO from '@/src/application/dto/StoreDTO';
import { ActivityIndicator } from 'react-native-paper';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import { getRouteStatusStore, getStoreStatusColor } from '@/utils/day-operation/utils';
import DAYS from '@/lib/days';


function findStoresAround(userLocation:LocationObject|null, stores:StoreDTO[]|null, kmAround:number):StoreDTO[] {
    let storesToShow:StoreDTO[] = [];
    if (userLocation !== null && stores !== null) {
        storesToShow = stores.filter((store) => {
            let isAround:boolean = false;
            const distance:number = distanceBetweenTwoPoints(
                parseFloat(store.latitude),
                parseFloat(store.longitude),
                userLocation.coords.latitude,
                userLocation.coords.longitude
            );

            if (distance <= kmAround / 10000) {
                isAround= true;
            } else {
                isAround = false;
            }

            return isAround;
        })
    } else {
        storesToShow = [];
    }

    return storesToShow;
}

function findColorForEachStore(stores: StoreDTO[], dayOperations: DayOperationDTO[]) : IStoreRouteMap[] {
    const storeRouteMap: IStoreRouteMap[] = [];
    const dayOperationMap = new Map<string, DayOperationDTO>(); // Accessing quickly to day operation by store id
    dayOperations.forEach((dayOperation) => {
        dayOperationMap.set(dayOperation.id_item, dayOperation);
    });

    stores.forEach((store) => {
        const dayOperation = dayOperationMap.get(store.id_store);
        let color = '';
        let status = '';
        if (dayOperation) {
            const { operation_type } = dayOperation;
            console.log("Day operation id: ", operation_type)
            color = getStoreStatusColor(operation_type);
            status = getRouteStatusStore(operation_type);

            
        } else {
            color = getStoreStatusColor(undefined);
            status = getRouteStatusStore(undefined);
        }

        console.log("Color: ", color)
        storeRouteMap.push({
            ...store,
            tw_color: color,
            route_status_store: status
        });
    })

    return storeRouteMap;
}

function mergeStoresToDisplay(storesWithStatus: IStoreRouteMap[], storesAround: IStoreRouteMap[], selectedStore: IStoreRouteMap|undefined): IStoreRouteMap[] {
    // Keep only nearby stores that already have a status (i.e., exist in storesWithStatus)
    const idsWithStatus = new Set(storesWithStatus.map(s => s.id_store));
    let nerbywithStatus: IStoreRouteMap[] = []
    if (selectedStore === undefined) {
        nerbywithStatus = storesAround.filter(s => !idsWithStatus.has(s.id_store));
    } else {
        nerbywithStatus = storesAround.filter(s => !idsWithStatus.has(s.id_store) && s.id_store !== selectedStore.id_store);
    }
    return [...storesWithStatus, ...nerbywithStatus];
}

const searchClientLayout = () => {
    const { getCurrentUserLocation } = useCurrentLocation();
    
    // Redux
    const storesRedux = useSelector((state: RootState) => state.stores);
    const dayOperationsRedux = useSelector((state: RootState) => state.dayOperations);
    const dispatch:AppDispatch = useDispatch();

    // States
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);
    
    const [storesToShow, setStoresToShow] = useState<IStoreRouteMap[]>([]);
    const [storesWithStatus, setStoresWithStatus] = useState<IStoreRouteMap[]>([]);
    const [mAround, setmAround] = useState<number>(300);
    const [selectedClient, setSelectedClient] = useState<IStoreRouteMap|undefined>();
    const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
    
    // States for the search bar
    const [selectedItems, setSelectedItems] = useState<IStoreRouteMap[]>([]);

    useEffect(() => {
        setUpSearchClientLayout();
        // loadUserLocationAndStores();
    }, [storesRedux, dayOperationsRedux]);

    const setUpSearchClientLayout = async() => {
        const location = await getCurrentUserLocation();
        setUserLocation(location);

        if (dayOperationsRedux !== null && storesRedux !== null) { 
            const dayOperations: DayOperationDTO[] = [...dayOperationsRedux];
            const idStoresWithDayOperation: Map<string, DayOperationDTO> = new Map<string, DayOperationDTO>();
            const storeWithRouteDay: IStoreRouteMap[] = [];

            // Get stores that alredy has day operations (today's client, clients attended out of route, etc) and set them in the state to show in the map
            dayOperations.forEach((dayOperation) => {
                const { operation_type, id_item } = dayOperation;    
                if (operation_type === DAY_OPERATIONS.attend_client_petition
                ||  operation_type === DAY_OPERATIONS.attention_out_of_route 
                ||  operation_type === DAY_OPERATIONS.new_client_registration
                ||  operation_type === DAY_OPERATIONS.route_client_attention) {
                    idStoresWithDayOperation.set(id_item, dayOperation); // In theory, there are only stores
                }
            });

            storesRedux.forEach((store) => {
                const { id_store } = store;
                const dayOperationForStore = idStoresWithDayOperation.get(id_store);       

                if (dayOperationForStore !== undefined) {
                    const { operation_type } = dayOperationForStore;
                    storeWithRouteDay.push({
                        ...store,
                        tw_color: getStoreStatusColor(operation_type),
                        route_status_store: getRouteStatusStore(operation_type)
                    });
                }
            });
            
            setStoresWithStatus(storeWithRouteDay);


            if (location) {
                // Get stores that are around the user
                const nearbyStores = findStoresAround(userLocation, [ ...storesRedux ], mAround);
                const storesWithColors = findColorForEachStore(nearbyStores, dayOperationsRedux);
                // mergeStoresToDisplay(storeWithRouteDay, storesWithColors, undefined)
                setStoresToShow([]);
            }
        }
    }

    const loadUserLocationAndStores = async () => {
        try {
            setIsLoadingLocation(true);
            const location = await getCurrentUserLocation();
            setUserLocation(location);
            
            if (location && storesRedux && dayOperationsRedux) {
                const nearbyStores = findStoresAround(location, [ ...storesRedux ], mAround);
                const storesWithColors = findColorForEachStore(nearbyStores, dayOperationsRedux);
                setStoresToShow(storesWithColors);
            }
        } catch (error) {
            console.log('Error loading location:', error);
            Toast.show({
                type: 'error',
                text1: 'Error al obtener ubicación',
                text2: 'No se pudo obtener tu ubicación actual'
            });
            setStoresToShow([]);
        } finally {
            setIsLoadingLocation(false);
        }
    }

    // Hanlder
    const handlerGoBack = () => { router.replace('/routeOperationMenuLayout'); }

    const handlerOnSelectItem = (selectedItem:IStoreRouteMap) => {
        const currnetItems:IStoreRouteMap[] = selectedItems.map((item:IStoreRouteMap) => { return item });
        setSelectedItems(
            [
                ...currnetItems,
                { ...selectedItem }
            ]
        );

        setSelectedClient(selectedItem);
        
        // Add to stores to show if not already there
        const isAlreadyInList = storesToShow.some(store => store.id_store === selectedItem.id_store);
        if (!isAlreadyInList) {
            setStoresToShow((prev) => [...prev, selectedItem]);
        }
    } 

    const handlerAcceptClient = ():void => {
        if (selectedClient) {
            const dayOperation:IDayOperation = createDayOperationConcept(
                selectedClient.id_store, 
                DAYS_OPERATIONS.sales,
                0,
                0
            )
            dispatch(setCurrentOperation(dayOperation));
            router.push('/salesLayout');
        } else {
            Toast.show({
                type:  'info',
                text1: 'Debes seleccionar un cliente.',
                text2: 'No puedes continuar hasta que selecciones un cliente.'
            });
        }
    }

    return (
        <SafeAreaView style={tw`flex-1`}>
            <View style={tw`w-full h-full flex flex-col`}>
                {/* Header */}
                <View style={tw`w-full flex flex-row justify-center items-center py-2`}>
                    <RouteHeader onGoBack={handlerGoBack}/>
                </View>

                {/* Search Bar */}
                <View style={tw`w-full flex flex-row justify-center items-center px-4 py-2`}>
                    <SearchBarWithSuggestions 
                        catalog={storesToShow || []}
                        selectedCatalog={selectedItems}
                        fieldToSearch={'store_name'}
                        keyField={'id_store'}
                        onSelectHandler={handlerOnSelectItem}
                    />
                </View>

                {/* Map Container */}
                <View style={tw`flex-1 px-4 py-2`}>
                    {userLocation === null ? (
                        <View style={tw`w-full h-full flex justify-center items-center border-2 border-gray-300 rounded-lg bg-gray-100`}>
                            <ActivityIndicator size="large" />
                            <Text style={tw`mt-2 text-gray-600`}>Cargando ubicación...</Text>
                        </View>
                    ) : (
                        <View style={tw`w-full h-full border-2 border-gray-300 rounded-lg overflow-hidden`}>
                            <RouteMap 
                                initialCoordinates={{ 
                                    latitude: userLocation?.coords.latitude || 20.66020491403627, 
                                    longitude: userLocation?.coords.longitude || -105.23041097690118 
                                }}
                                selectedStore={selectedClient}
                                stores={storesToShow}
                                onClick={setSelectedClient}
                            />
                        </View>
                    )}
                </View>

                {/* Selected Client Info */}
                <View style={tw`w-full px-4 py-3 flex flex-col justify-center items-center`}>
                    <Text style={tw`text-base text-gray-600`}>Cliente seleccionado</Text>
                    <Text style={tw`text-lg font-bold text-black text-center`}>
                        {selectedClient 
                            ? capitalizeFirstLetterOfEachWord(selectedClient.store_name || 'Sin nombre') 
                            : 'No se ha seleccionado ningún cliente.'
                        }
                    </Text>
                </View>

                {/* Confirmation Band */}
                <View style={tw`w-full px-4 py-2`}>
                    <ConfirmationBand 
                        textOnAccept='Iniciar venta'
                        textOnCancel='Volver a menú'
                        handleOnAccept={handlerAcceptClient}
                        handleOnCancel={handlerGoBack}
                    />
                </View>
            </View>
        </SafeAreaView>
    )
}


export default searchClientLayout;