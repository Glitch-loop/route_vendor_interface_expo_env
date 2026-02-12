// Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { router } from 'expo-router';
import { LocationObject, LocationObjectCoords } from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';

// Hooks
import useCurrentLocation from '@/hooks/useCurrentLocation';

// Interfaces
import { IDayOperation, IStore, IStoreStatusDay, IStoreRouteMap } from '@/interfaces/interfaces';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';

// Utils
import { convertStoreDTOToIStoreRouteMap, distanceBetweenTwoPoints } from '@/utils/stores/utils';
// import DAYS_OPERATIONS from '@/lib/day_operations';
import DAY_OPERATIONS from '@/src/core/enums/DayOperations';

// Controllers
import { createDayOperationConcept } from '@/controllers/DayOperationController';

// UI - Components
import RouteMap from '@/components/shared-components/RouteMap';
import SearchBarWithSuggestions from '@/components/shared-components/SearchBarWithSuggestions';
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
import { LatLng } from 'react-native-maps';

function findStoresAround(pivotLocation:LocationObjectCoords|LatLng|null, stores:IStoreRouteMap[]|null, metersAround:number):IStoreRouteMap[] {
    let storesToShow:IStoreRouteMap[] = [];

    console.log("All stores: ", stores?.length)
    if (pivotLocation !== null && stores !== null) {
        const kmRange = metersAround / 1000; // Convert meters to kilometers
        
        console.log("RANGE: ", kmRange)
        storesToShow = stores.filter((store) => {
            // distanceBetweenTwoPoints returns distance in kilometers
            const distanceInKm:number = distanceBetweenTwoPoints(
                parseFloat(store.latitude),
                parseFloat(store.longitude),
                pivotLocation.latitude,
                pivotLocation.longitude
            );

            console.log(`Distance to store ${store.store_name}: ${distanceInKm.toFixed(2)}`);
            return distanceInKm <= kmRange;
        });
        
        console.log(`Found ${storesToShow.length} stores within ${metersAround}m (${kmRange}km)`);
    } else {
        storesToShow = [];
    }

    return storesToShow;
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
    

    // Search by range
    const [mAround, setmAround] = useState<number>(300);
    const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<LatLng|undefined>(undefined);

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
        setIsLoadingLocation(location === null);

        if (dayOperationsRedux !== null && storesRedux !== null) {
            // Get catalog of stores.
            const allStores:IStoreRouteMap[] = convertStoreDTOToIStoreRouteMap([...storesRedux], [...dayOperationsRedux]);
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
                const nearbyStores = findStoresAround(location.coords, [ ...allStores ], mAround);
                setStoresAround(nearbyStores);
                setStoresToShow(mergeStoresToDisplay(storeWithRouteDay, nearbyStores, undefined));
            }
        }
    }

    // Handlers
    const handlerGoBack = () => { router.replace('/routeOperationMenuLayout'); }

    const handlerRangeChange = async (newRange: number) => {
        console.log(`Changing search range to ${newRange}m`);
        setmAround(newRange);
        
        const userCurrentLocation: LocationObject | null = await getCurrentUserLocation();

        if (userCurrentLocation === null && selectedLocation === undefined) {
            Toast.show({
                type: 'error',
                text1: 'No hay un punto de referencia para buscar tiendas cercanas.',
                text2: 'Asegúrate de que los permisos de ubicación estén habilitados o selecciona un punto en el mapa.'
            });
            return;
        }



        // Update stores around with new range
        if (allStoresCatalog.length > 0 && dayOperationsRedux) {
            const pivotLocation:LocationObjectCoords|LatLng = selectedLocation ? selectedLocation : userCurrentLocation!.coords;

            const nearbyStores = findStoresAround(pivotLocation, [...allStoresCatalog], newRange);
            setStoresAround(nearbyStores);
            
            // Check if selected client is still within range
            if (selectedClient) {
                const isSelectedClientInRange = nearbyStores.some(
                    store => store.id_store === selectedClient.id_store
                );
                
                if (!isSelectedClientInRange) {
                    console.log('Selected client is now outside the search range');
                    // Keep the selected client visible even if outside range
                    setStoresToShow(mergeStoresToDisplay(storesWithStatus, nearbyStores, selectedClient));
                } else {
                    setStoresToShow(mergeStoresToDisplay(storesWithStatus, nearbyStores, selectedClient));
                }
            } else {
                setStoresToShow(mergeStoresToDisplay(storesWithStatus, nearbyStores, undefined));
            }
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
        if (dayOperationsRedux === null) {
            Toast.show({
                type:  'info',
                text1: 'Ha ocurrido un error inesperado.',
                text2: 'Porfavor reinicia la aplicación.'
            });
            return;
        }

        if (selectedClient) {
            const { id_store } = selectedClient;
            const dayOperation:DayOperationDTO|undefined = dayOperationsRedux.find((dayOperation) => {
                return dayOperation.id_item === id_store 
                && (dayOperation.operation_type === DAY_OPERATIONS.attend_client_petition
                ||  dayOperation.operation_type === DAY_OPERATIONS.new_client_registration
                ||  dayOperation.operation_type === DAY_OPERATIONS.route_client_attention
                ||  dayOperation.operation_type === DAY_OPERATIONS.attention_out_of_route
                );
            });

            if(dayOperation) {
                const { id_day_operation } = dayOperation;
                router.push(`/salesLayout?id_store_search_param=${id_store}&id_day_operation_dependent_search_param=${id_day_operation}`);
            } else {
                router.push(`/salesLayout?id_store_search_param=${id_store}&is_selling_out_of_route=1`);
            }
        } else {
            Toast.show({
                type:  'info',
                text1: 'Debes seleccionar un cliente.',
                text2: 'No puedes continuar hasta que selecciones un cliente.'
            });
        }
    }

    const handleSelectLocation = async (coordinates: LatLng|undefined) => {
        setSelectedLocation(coordinates);
        if (coordinates) { // User select a location in the map.
            const nearbyStores = findStoresAround(coordinates, allStoresCatalog, mAround);
            setStoresToShow(mergeStoresToDisplay(storesWithStatus, nearbyStores, selectedClient));
        } else { // User deselect location in the map, we return to show stores around user location.
            const userCurrentLocation = await getCurrentUserLocation();

            if (userCurrentLocation === null) {
                setStoresToShow(mergeStoresToDisplay(storesWithStatus, [], selectedClient));
                Toast.show({
                    type: 'error',
                    text1: 'No se pudo obtener tu ubicación.',
                    text2: 'Asegúrate de que los permisos de ubicación estén habilitados para encontrar tiendas cerca de ti.'
                });
            } else {
                const { coords } = userCurrentLocation;
                const nearbyStores = findStoresAround(coords, allStoresCatalog, mAround);
                setStoresToShow(mergeStoresToDisplay(storesWithStatus, nearbyStores, selectedClient));
            }
        }
    }

    return (
        <SafeAreaView style={tw`flex-1`}>
            <View style={tw`w-full h-full flex flex-col`}>
                {/* Scrollable Top Section */}
                <ScrollView 
                    showsVerticalScrollIndicator={true}
                    style={tw`w-full`}
                    contentContainerStyle={tw`pb-4`}>
                    
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

                    <Text style={tw`text-lg text-center mb-2`}>Buscando por: 
                        <Text style={tw`font-bold`}>{isSearchByAddress ? ' Dirección de tienda' : ' Nombre de tienda'}</Text>
                    </Text>
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

                    {/* Range Selection */}
                    <View style={tw`w-full px-4 py-2`}>
                        <RangeButtonSelection
                            value={mAround}
                            onValueChange={handlerRangeChange}
                        />
                        <Text style={tw`text-center text-sm text-gray-600 mt-2`}>
                            {storesAround.length} tienda{storesAround.length !== 1 ? 's' : ''} encontrada{storesAround.length !== 1 ? 's' : ''} en el rango
                        </Text>
                    </View>

                    {/* Map Container - Much Larger */}
                    <View style={tw`w-full h-80 flex-1 px-4 py-2`}>
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
                                    onSelectLocation={handleSelectLocation}
                                />
                            </View>
                        )}
                    </View>

                    {/* Selected Client Info */}
                    <View style={tw`w-full px-4 py-2 flex flex-col justify-center items-center`}>
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
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}


export default searchClientLayout;