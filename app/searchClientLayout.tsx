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
import { IDayOperation, IStore, IStoreStatusDay } from '@/interfaces/interfaces';
import { capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';

// Utils
import { distanceBetweenTwoPoints } from '@/utils/routesFunctions';
import DAYS_OPERATIONS from '@/lib/day_operations';

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

const searchClientLayout = () => {
    const { getCurrentUserLocation } = useCurrentLocation();
    
    // Redux
    const stores = useSelector((state: RootState) => state.stores);
    const dispatch:AppDispatch = useDispatch();

    // States
    const [storesToShow, setStoresToShow] = useState<StoreDTO[]>([]);
    const [mAround, setmAround] = useState<number>(300);
    const [selectedClient, setSelectedClient] = useState<StoreDTO|undefined>();
    const [selectedItems, setSelectedItems] = useState<StoreDTO[]>([]);
    const [userLocation, setUserLocation] = useState<LocationObject | null>(null);
    const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(true);

    useEffect(() => {
        loadUserLocationAndStores();
    }, [stores]);

    const loadUserLocationAndStores = async () => {
        try {
            setIsLoadingLocation(true);
            const location = await getCurrentUserLocation();
            setUserLocation(location);
            
            if (location && stores) {
                const nearbyStores = findStoresAround(location, stores, mAround);
                setStoresToShow(nearbyStores);
            }
        } catch (error) {
            console.log('Error loading location:', error);
            Toast.show({
                type: 'error',
                text1: 'Error al obtener ubicación',
                text2: 'No se pudo obtener tu ubicación actual'
            });
            setStoresToShow(stores || []);
        } finally {
            setIsLoadingLocation(false);
        }
    }

    // Hanlder
    const handlerGoBack = () => {
        router.replace('/routeOperationMenuLayout');
    }

    const handlerOnSelectItem = (selectedItem:StoreDTO) => {
        const currnetItems:StoreDTO[] = selectedItems.map((item:StoreDTO) => { return item });
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
                        catalog={stores || []}
                        selectedCatalog={selectedItems}
                        fieldToSearch={'store_name'}
                        keyField={'id_store'}
                        onSelectHandler={handlerOnSelectItem}
                    />
                </View>

                {/* Map Container */}
                <View style={tw`flex-1 px-4 py-2`}>
                    {isLoadingLocation ? (
                        <View style={tw`w-full h-full flex justify-center items-center border-2 border-gray-300 rounded-lg bg-gray-100`}>
                            <ActivityIndicator size="large" />
                            <Text style={tw`mt-2 text-gray-600`}>Cargando ubicación...</Text>
                        </View>
                    ) : (
                        <View style={tw`w-full h-full border-2 border-gray-300 rounded-lg overflow-hidden`}>
                            <RouteMap 
                                latitude={userLocation?.coords.latitude || 20.66020491403627}
                                longitude={userLocation?.coords.longitude || -105.23041097690118}
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