// Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { router } from 'expo-router';
import { LocationObject } from 'expo-location';

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


function findStoresAround(userLocation:LocationObject|null, stores:(IStore&IStoreStatusDay)[], kmAround:number):IStore[] {
    let storesToShow:IStore[] = [];
    if (userLocation) {
        storesToShow = stores.filter((store) => {
            let isAround:boolean = false;
            const distance:number = distanceBetweenTwoPoints(
                parseFloat(store.latitude),
                parseFloat(store.longuitude),
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

    const [storesToShow, setStoresToShow] = useState<IStore[]>([]);
    const [mAround, setmAround] = useState<number>(300);
    const [selectedClient, setSelectedClient] = useState<IStore|undefined>() ;

    const [selectedItems, setSelectedItems] = useState<IStore[]>([]);

    useEffect(() => {
        getCurrentUserLocation()
        .then((userLocation:LocationObject|null) => {
            setStoresToShow(findStoresAround(userLocation, stores, mAround));
        })
        .catch(() => setStoresToShow([]));
    }, []);

    // Hanlder
    const handlerGoBack = () => {
        router.replace('/routeOperationMenuLayout');
    }

    const handlerOnSelectItem = (selectedItem:IStore) => {
        const currnetItems:IStore[] = selectedItems.map((item:IStore) => { return item });
        setSelectedItems(
            [
                ...currnetItems,
                { ...selectedItem }
            ]
        )

        setSelectedClient(selectedItem);
        setStoresToShow((prev) => { return [...prev, selectedItem]})
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
        <KeyboardAvoidingView
        enabled={false}
        style={{ flex: 1 }}>
            {/* style={tw`w-full flex flex-col`} */}
            <ScrollView contentContainerStyle={{ flex: 1 }}>
                <View style={tw`w-full flex-1 items-center`}>
                    <View style={tw`flex basis-1/12`}>
                        <RouteHeader onGoBack={() => {handlerGoBack()}}/>
                    </View>
                    <View style={tw`relative basis-1/12 w-full flex flex-row justify-center items-center my-2`}>
                        <View style={tw`absolute w-full flex items-center`}>
                            <SearchBarWithSuggestions 
                                catalog={stores}
                                selectedCatalog={selectedItems}
                                fieldToSearch={'store_name'}
                                keyField={'id_store'}
                                onSelectHandler={handlerOnSelectItem}
                            />
                        </View>
                    </View>
                    <View style={tw`w-11/12 flex basis-7/12 border-solid border-2 rounded-sm`}>
                        <RouteMap 
                            latitude={20.66020491403627}
                            longitude={-105.23041097690118}
                            stores={storesToShow} 
                            onClick={setSelectedClient}/> 
                    </View>
                    <View style={tw`w-11/12 flex basis-1/12 justify-center items-center`}>
                        <Text style={tw`text-lg`}>Cliente seleccionado</Text>
                        <Text style={tw`text-lg font-bold`}>
                            {
                                selectedClient ? capitalizeFirstLetterOfEachWord(selectedClient.store_name) : 
                                    'No se ha seleccionado ningún cliente.'
                            }
                        </Text>
                    </View>
                    <View style={tw`mt-3 w-full basis-2/12 flex flex-row justify-between`}>
                        <ConfirmationBand 
                            textOnAccept='Iniciar venta'
                            textOnCancel='Volver a menu'
                            handleOnAccept={() => {handlerAcceptClient();}}
                            handleOnCancel={() => {handlerGoBack();}}
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}


export default searchClientLayout;