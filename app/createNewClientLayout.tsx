// Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Router, useRouter }  from 'expo-router';

// Redux
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

// Components
import MenuHeader from '@/components/shared-components/MenuHeader';
import RouteMap from '@/components/shared-components/RouteMap';
import useCurrentLocation from '@/hooks/useCurrentLocation';
import { LocationObject, LocationObjectCoords } from 'expo-location';
import { LatLng } from 'react-native-maps';

// Utils
import { convertStoreDTOToIStoreRouteMap, findStoresAround } from '@/utils/stores/utils';
import { IStoreRouteMap } from '@/interfaces/interfaces';
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native-paper';
import ProjectButton from '@/components/shared-components/ProjectButton';

export default function CreateNewClientLayout() {
  // Hooks
  const router: Router = useRouter();
  const userLocationHook = useCurrentLocation();
  
  // Redux
  const storesRedux = useSelector((state: RootState) => state.stores);
  const dayOperationsRedux = useSelector((state: RootState) => state.dayOperations);

  // States
  const [userLocation, setUserLocation] = useState<LocationObjectCoords|LatLng|undefined>(undefined);
  const [nearStores, setNearStores] = useState<IStoreRouteMap[]>([]);
  

  useEffect(() => {
    setUpCreateNewClientLayout();
  }, [storesRedux, dayOperationsRedux]);

  // Auxiliar functions
  const setUpCreateNewClientLayout = async ():Promise<void> => {
    const userLocationCoordinates = await determineUserLocation();
    console.log("User location coordinates: ", userLocationCoordinates);
    if(storesRedux !== null && dayOperationsRedux !== null && userLocationCoordinates !== undefined) {
      const storesRouteMap: IStoreRouteMap[] = convertStoreDTOToIStoreRouteMap(storesRedux, dayOperationsRedux);
      const storesAround: IStoreRouteMap[] = findStoresAround(userLocationCoordinates, storesRouteMap, 500);
      setNearStores(storesAround);
    } else {
      Toast.show({type: 'error', text1:'Error cargando el mapa.', text2: 'Por favor, reinicia la aplicación e intenta de nuevo.'});
    }
  }

  const determineUserLocation = async ():Promise<LocationObjectCoords|undefined> => {
    const location: LocationObject|null = await userLocationHook.getCurrentUserLocation();
    let coordinates: LocationObjectCoords|undefined = undefined;

    if (location !== null) {
      const { coords } = location;
      coordinates = coords;
      setUserLocation(coordinates);
    } else {
      setUserLocation(undefined);
    }

    return coordinates
  }

  //Handlers
  const handleGoBack = (): void => {
    console.log("Going back to route operation menu")
    router.replace('/routeOperationMenuLayout');
    
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView 
        style={tw`flex-1`} 
        behavior='padding'
        keyboardVerticalOffset={30}>
      {/* Header */}
      <View style={tw`w-full flex flex-row justify-center items-center py-2`}>
        <MenuHeader 
          onGoBack={handleGoBack}
        />
      </View>
      <ScrollView contentContainerStyle={tw`pb-8`}>
        {/* Map section: show near clients */}
        <View style={tw`w-full h-80 flex-1 px-4 py-2`}>
            { userLocation &&
              <Text style={tw`text-lg text-center font-semibold text-gray-900`}>Tiendas cercanas</Text>
            }
            {userLocation === undefined ? (
                <View style={tw`w-full h-full flex justify-center items-center border-2 border-gray-300 rounded-lg bg-gray-100`}>
                    <ActivityIndicator size="large" />
                    <Text style={tw`mt-2 text-gray-600`}>Cargando ubicación...</Text>
                </View>
            ) : (
              <View style={tw`w-full h-full border-2 border-gray-300 rounded-lg overflow-hidden`}>
                <RouteMap 
                  initialCoordinates={userLocation} 
                  stores={nearStores} />
              </View>
            )}
        </View>

        {/* Campo de búsqueda de dirección (consulta a Google Maps) */}
        <View style={tw`px-4 mt-4`}>
          <Text style={tw`text-base font-semibold text-gray-800`}>Buscar dirección</Text>
          <TextInput
            placeholder="Escribe una dirección para buscar..."
            style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2 text-gray-900`}
          />
        </View>

        {/* Formulario: un campo por cada atributo de StoreDTO (sin latitud/longitud) */}
        <View style={tw`px-4 mt-6`}>
          <Text style={tw`text-lg font-bold text-gray-900`}>Nuevo cliente</Text>

          {/* store_name */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Nombre de la tienda</Text>
            <TextInput placeholder="Nombre del negocio" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* street */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Calle</Text>
            <TextInput placeholder="Nombre de la calle" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* ext_number */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Número exterior</Text>
            <TextInput placeholder="p. ej., 123" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* colony */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Colonia</Text>
            <TextInput placeholder="Colonia / barrio" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* postal_code */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Código postal</Text>
            <TextInput placeholder="p. ej., 12345" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* address_reference */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Referencia de la dirección</Text>
            <TextInput placeholder="Referencias o indicaciones adicionales" style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>
        </View>
        <View style={tw`w-full h-12 mt-5 flex flex-row justify-center items-center`}>
          <ProjectButton 
            title='Crear cliente y continuar con venta'
            // onPress={() => {handlerOnStartSale();}}
            onPress={() => {}}
            buttonVariant='success'
            buttonStyle={tw`h-14 rounded flex flex-row basis-1/2  justify-center items-center `}/>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
