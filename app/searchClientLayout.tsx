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
import RangeButtonSelection from '@/components/search-client/RangeButtonSelection';
import Toast from 'react-native-toast-message';
import StoreDTO from '@/src/application/dto/StoreDTO';
import { ActivityIndicator } from 'react-native-paper';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import { getRouteStatusStore, getStoreStatusColor } from '@/utils/day-operation/utils';
import DAYS from '@/lib/days';
import ProjectButton from '@/components/shared-components/ProjectButton';
import { getAddressOfStore } from '@/utils/stores/utils';

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

            if (distance <= kmAround / 1000) {
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

function convertRouteDTOToIStoreRouteMap(stores: StoreDTO[], dayOperations: DayOperationDTO[]) : IStoreRouteMap[] {
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
    let nerbywithStatus: IStoreRouteMap[] = [];
    let storesWithStatusWithoutSelectedStore: IStoreRouteMap[] = []; // User can select a store that is in stores around but also in stores with status.
    let storesToReturn: IStoreRouteMap[] = [];

    if (selectedStore === undefined) {
        nerbywithStatus = storesAround.filter(s => !idsWithStatus.has(s.id_store));
        storesWithStatusWithoutSelectedStore = [...storesWithStatus];
        storesToReturn = [...storesWithStatusWithoutSelectedStore, ...nerbywithStatus];
    } else {
        nerbywithStatus = storesAround.filter(s => !idsWithStatus.has(s.id_store) && s.id_store !== selectedStore.id_store);
        storesWithStatusWithoutSelectedStore = storesWithStatus.filter(s => s.id_store !== selectedStore.id_store);
        storesToReturn = [...storesWithStatusWithoutSelectedStore, ...nerbywithStatus, selectedStore];
    }
    return storesToReturn;
}

function validatorCriteriaByStoreNameForSearchBar(query: string, item: IStoreRouteMap):boolean {
    const { store_name } = item;
    let result = false;
    if (store_name === undefined || store_name === null) {
        result = false;
    } else {
        result = store_name.toLowerCase().includes(query.toLowerCase());
    }
    return result;
}

function criteriaForSelectedItemsByStoreNameForSearchBar(item: IStoreRouteMap, selectedItems: IStoreRouteMap[]):boolean {
    return selectedItems.some(selectedItem => selectedItem.store_name === item.store_name);
}


function validatorCriteriaByStoreAddressForSearchBar(query: string, item: IStoreRouteMap):boolean {
    const store_address = getAddressOfStore(item);
    let result = false;
    if (store_address === undefined || store_address === null) {
        result = false;
    } else {
        result = store_address.toLowerCase().includes(query.toLowerCase());
    }
    return result;
}

function criteriaForSelectedItemsByStoreAddressForSearchBar(item: IStoreRouteMap, selectedItems: IStoreRouteMap[]):boolean {
    return selectedItems.some(selectedItem => getAddressOfStore(selectedItem) === getAddressOfStore(item));
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
    const [allStoresCatalog, setAllStoresCatalog] = useState<IStoreRouteMap[]>([]);
    
    const [storesWithStatus, setStoresWithStatus] = useState<IStoreRouteMap[]>([]);
    const [selectedClient, setSelectedClient] = useState<IStoreRouteMap|undefined>();
    const [storesAround, setStoresAround] = useState<IStoreRouteMap[]>([]);
    
    const [mAround, setmAround] = useState<number>(300);
    const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
    
    // States for the search bar
    const [selectedItems, setSelectedItems] = useState<IStoreRouteMap[]>([]);
    const [isSearchByAddress, setIsSearchByAddress] = useState<boolean>(true);


    useEffect(() => {
        setUpSearchClientLayout();
        // loadUserLocationAndStores();
    }, [storesRedux, dayOperationsRedux]);

    const setUpSearchClientLayout = async() => {
        const location = await getCurrentUserLocation();
        setUserLocation(location);

        if (dayOperationsRedux !== null && storesRedux !== null) {
            // Get catalog of stores.
            const allStores:IStoreRouteMap[] =convertRouteDTOToIStoreRouteMap([...storesRedux], [...dayOperationsRedux]);
            setAllStoresCatalog(allStores);


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

            allStores.forEach((store) => {
                const { id_store } = store;
                const dayOperationForStore = idStoresWithDayOperation.get(id_store);       

                if (dayOperationForStore !== undefined) {
                    storeWithRouteDay.push(store);
                }
            });
            
            setStoresWithStatus(storeWithRouteDay);


            if (location) {
                // Get stores that are around the user
                const nearbyStores = findStoresAround(userLocation, [ ...allStores ], mAround);
                const storesWithColors = convertRouteDTOToIStoreRouteMap(nearbyStores, [...dayOperationsRedux]);
                setStoresAround(storesWithColors);
                setStoresToShow(mergeStoresToDisplay(storeWithRouteDay, storesWithColors, undefined));
            }
        }
    }

    // Handlers
    const handlerGoBack = () => { router.replace('/routeOperationMenuLayout'); }

    const handlerRangeChange = (newRange: number) => {
        setmAround(newRange);
        
        // Update stores around with new range
        if (userLocation && allStoresCatalog.length > 0 && dayOperationsRedux) {
            const nearbyStores = findStoresAround(userLocation, [...allStoresCatalog], newRange);
            const storesWithColors = convertRouteDTOToIStoreRouteMap(nearbyStores, [...dayOperationsRedux]);
            setStoresAround(storesWithColors);
            setStoresToShow(mergeStoresToDisplay(storesWithStatus, storesWithColors, selectedClient));
        }
    }

    const handlerOnSelectItem = (selectedItem:IStoreRouteMap) => {
        if (selectedClient === undefined) {
            setSelectedItems(
                [
                    ...selectedItems,
                    { ...selectedItem }
                ]
            );

            storesToShow.filter((store) => store.id_store !== selectedItem.id_store);
        } else {
            const currentsItems:IStoreRouteMap[] = selectedItems.filter((item) => item.id_store !== selectedClient?.id_store) // Remove previously selected item if exists
            setSelectedItems(
                [
                    ...currentsItems,
                    { ...selectedItem }
                ]
            );
            storesToShow.filter((store) => store.id_store !== selectedClient.id_store && store.id_store !== selectedItem.id_store);
        }
        setStoresToShow(mergeStoresToDisplay(storesWithStatus, storesAround, { ...selectedItem }))
        setSelectedClient(selectedItem);
        
        // Add to stores to show if not already there
        
        // const isAlreadyInList = storesToShow.some(store => store.id_store === selectedItem.id_store);
        // if (!isAlreadyInList) {
        //     setStoresToShow((prev) => [...prev, selectedItem]);
        // }
    } 

    const handlerAcceptClient = ():void => {
        if (selectedClient) {
            const dayOperation:IDayOperation = createDayOperationConcept(
                selectedClient.id_store, 
                DAY_OPERATIONS.sales,
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
                        catalog={allStoresCatalog || []}
                        selectedCatalog={selectedItems}
                        fieldToSearch={'store_name'}
                        keyField={'id_store'}
                        onSelectHandler={handlerOnSelectItem}
                        criteriaForValidQuery={
                            isSearchByAddress ? validatorCriteriaByStoreAddressForSearchBar :
                            validatorCriteriaByStoreNameForSearchBar}
                        criteriaForSelectedItems={
                            isSearchByAddress ? criteriaForSelectedItemsByStoreAddressForSearchBar :
                            criteriaForSelectedItemsByStoreNameForSearchBar}
                    />
                </View>

                <View style={tw`w-full flex flex-row justify-between items-center px-4 py-2 mb-2`}>
                    <ProjectButton
                        title={'Buscar por nombre'}
                        onPress={() => {setIsSearchByAddress(false)}}
                        buttonVariant={'primary'}
                        buttonStyle={tw`self-center p-2 py-4 rounded`}                        
                        disabled={!isSearchByAddress}/>
                    <ProjectButton
                        title={'Buscar por dirección'}
                        onPress={() => {setIsSearchByAddress(true)}}
                        buttonVariant={'primary'}
                        buttonStyle={tw`self-center p-2 py-4 rounded`}
                        disabled={isSearchByAddress}/>
                </View>
                <Text style={tw`text-center mb-2`}>Buscando por: 
                    <Text style={tw`font-bold`}>{isSearchByAddress ? ' Dirección de tienda' : ' Nombre de tienda'}</Text>
                </Text>

                {/* Range Selection */}
                <View style={tw`w-full px-4 py-2`}>
                    <RangeButtonSelection
                        value={mAround}
                        onValueChange={handlerRangeChange}
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