import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import tw from 'twrnc';
import { router, Router, useRouter } from 'expo-router';
import RouteMap from '@/components/RouteMap';

// Redux context
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import ConfirmationBand from '@/components/ConfirmationBand';
import useCurrentLocation from '@/hooks/useCurrentLocation';
import RouteHeader from '@/components/RouteHeader';
import { IStore } from '@/interfaces/interfaces';
import { LocationObject } from 'expo-location';
import { distanceBetweenTwoPoints } from '@/utils/routesFunctions';
import SearchBarWithSuggestions from '@/components/SalesLayout/SearchBarWithSuggestions';


function findStoresAroung(userLocation:LocationObject|null, stores:IStore[], kmAround:number):IStore[] {
    let storesToShow:IStore[] = [];
    if (userLocation) {
        storesToShow = stores.filter((store) => {
            let isAround:boolean = false;
            const distance:number = distanceBetweenTwoPoints(
                parseFloat(store.latitude),
                parseFloat(store.longuitude),
                20.641125309922, 
                -105.22117756486865
                // userLocation.coords.latitude,
                // userLocation.coords.longitude
            );

            if (distance <= kmAround / 10000) {
                isAround= true;
                console.log("distance: ", distance);
                console.log("distance: ", kmAround / 10000);
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
    
    const stores = useSelector((state: RootState) => state.stores);

    const [storesToShow, setStoresToShow] = useState<IStore[]>([]);
    const [mAround, setmAround] = useState<number>(100);

    const [selectedItems, setSelectedItems] = useState<IStore[]>([]);

    useEffect(() => {
        getCurrentUserLocation()
        .then((userLocation:LocationObject|null) => {
            console.log(findStoresAroung(userLocation, stores, mAround))
            setStoresToShow(findStoresAroung(userLocation, stores, mAround));
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
    } 

    return (
        <KeyboardAvoidingView
        enabled={false}
        style={{ flex: 1 }}>
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
                    <View style={tw`w-11/12 flex basis-8/12 border-solid border-2 rounded-sm`}>
                        <RouteMap 
                            latitude={20.641125309922}
                            longitude={-105.22117756486865}
                            stores={storesToShow} /> 
                    </View>
                    <View style={tw`mt-3 w-full basis-2/12 flex flex-row justify-between`}>
                        <ConfirmationBand 
                            textOnAccept='Iniciar venta'
                            textOnCancel='Volver a menu'
                            handleOnAccept={() => {}}
                            handleOnCancel={() => {handlerGoBack()}}
                        />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}


export default searchClientLayout;