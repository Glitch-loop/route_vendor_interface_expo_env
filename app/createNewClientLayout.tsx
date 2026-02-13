// Libraries
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import tw from 'twrnc';
import { Router, useRouter }  from 'expo-router';

// Redux
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/redux/store';
import { setDayOperations } from '@/redux/slices/dayOperationsSlice';
import { setStores } from '@/redux/slices/storesSlice';

// Components
import MenuHeader from '@/components/shared-components/MenuHeader';
import RouteMap from '@/components/shared-components/RouteMap';
import useCurrentLocation from '@/hooks/useCurrentLocation';

// Interfaces
import { LocationObject, LocationObjectCoords } from 'expo-location';
import { LatLng } from 'react-native-maps';

// Utils
import { convertStoreDTOToIStoreRouteMap, findStoresAround } from '@/utils/stores/utils';
import { IStoreRouteMap } from '@/interfaces/interfaces';
import Toast from 'react-native-toast-message';
import { ActivityIndicator } from 'react-native-paper';
import ProjectButton from '@/components/shared-components/ProjectButton';
import { container as di_container } from 'tsyringe';
import { RegisterNewClientUseCase } from '@/src/application/commands/RegisterNewClientUseCase';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import RetrieveDayOperationQuery from '@/src/application/queries/RetrieveDayOperationQuery';
import ListAllRegisterdStoresQuery from '@/src/application/queries/ListAllRegisterdStoresQuery';

interface NewClientFormData {
  store_name: string;
  street: string;
  ext_number: string;
  colony: string;
  postal_code: string;
  address_reference: string;
}

export default function CreateNewClientLayout() {
  // Hooks
  const router: Router = useRouter();
  const userLocationHook = useCurrentLocation();
  
  // Redux
  const dispatch: AppDispatch = useDispatch();  

  const storesRedux = useSelector((state: RootState) => state.stores);
  const dayOperationsRedux = useSelector((state: RootState) => state.dayOperations);
  const userSessionReduxState = useSelector((state: RootState) => state.user);

  // States
  const [userLocation, setUserLocation] = useState<LocationObjectCoords|LatLng|undefined>(undefined);
  const [nearStores, setNearStores] = useState<IStoreRouteMap[]>([]);
  const [formData, setFormData] = useState<NewClientFormData>({
    store_name: '',
    street: '',
    ext_number: '',
    colony: '',
    postal_code: '',
    address_reference: ''
  });


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

  const handleFormChange = (field: keyof NewClientFormData, value: string): void => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }


  const handleOnRegisterNewClient = async (): Promise<void> => {
    // Validate user session
    if (userSessionReduxState === null) {
      Toast.show({type: 'error', text1: 'Ha habido un error.', text2: 'Tu sesión ha expirado, por favor inicia sesión nuevamente.'});
      return;
    }

    // Validate required fields
    if (!formData.store_name.trim()) {
      Toast.show({type: 'error', text1: 'Campo requerido', text2: 'El nombre de la tienda es obligatorio'});
      return;
    }
    if (!formData.street.trim()) {
      Toast.show({type: 'error', text1: 'Campo requerido', text2: 'La calle es obligatoria'});
      return;
    }
    if (!formData.ext_number.trim()) {
      Toast.show({type: 'error', text1: 'Campo requerido', text2: 'El número exterior es obligatorio'});
      return;
    }
    if (!formData.colony.trim()) {
      Toast.show({type: 'error', text1: 'Campo requerido', text2: 'La colonia es obligatoria'});
      return;
    }
    if (!formData.postal_code.trim()) {
      Toast.show({type: 'error', text1: 'Campo requerido', text2: 'El código postal es obligatorio'});
      return;
    }

    if (!userLocation) {
      Toast.show({type: 'error', text1: 'Ubicación requerida', text2: 'No se pudo obtener la ubicación'});
      return;
    }

    // Create StoreDTO from form data
    const newStoreData:NewClientFormData = {
      ...formData
    };

    const { store_name, street, ext_number, colony, postal_code, address_reference } = newStoreData;

    const registerNewClientUseCase = di_container.resolve<RegisterNewClientUseCase>(RegisterNewClientUseCase)
    const retrieveDayOperationQuery = di_container.resolve<RetrieveDayOperationQuery>(RetrieveDayOperationQuery);
    const retrieveRegisteredStores = di_container.resolve<ListAllRegisterdStoresQuery>(ListAllRegisterdStoresQuery);

    try {
      const dayOperation:DayOperationDTO = await registerNewClientUseCase.execute(
        store_name,
        street,
        ext_number,
        colony,
        postal_code,
        address_reference,
        { ...userSessionReduxState }
      )

      dispatch(setDayOperations(await retrieveDayOperationQuery.execute()));
      dispatch(setStores(await retrieveRegisteredStores.execute()));

      Toast.show({
        type: 'success', 
        text1: 'Cliente registrado', 
        text2: 'El cliente se ha registrado correctamente'
      });
      
      const { id_day_operation, id_item } = dayOperation;
      router.push(`/salesLayout?id_store_search_param=${id_item}&id_day_operation_dependent_search_param=${id_day_operation}`);
    } catch (error) {
      console.error("Error registering new client: ", error);
      Toast.show({
        type: 'error', 
        text1: 'Problemas al registrar el nuevo cliente.', 
        text2: 'Ha ocurrido un error al registrar el cliente'
      });
    }
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
          onGoBack={handleGoBack}/>
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
        <View style={tw`px-4 mt-7`}>
          <Text style={tw`text-lg font-bold text-gray-900`}>Nuevo cliente</Text>

          {/* store_name */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Nombre de la tienda</Text>
            <TextInput 
              placeholder="Nombre del negocio" 
              value={formData.store_name}
              onChangeText={(text) => handleFormChange('store_name', text)}
              style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* street */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Calle</Text>
            <TextInput 
              placeholder="Nombre de la calle" 
              value={formData.street}
              onChangeText={(text) => handleFormChange('street', text)}
              style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* ext_number */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Número exterior</Text>
            <TextInput 
              placeholder="p. ej., 123" 
              value={formData.ext_number}
              onChangeText={(text) => handleFormChange('ext_number', text)}
              style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* colony */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Colonia</Text>
            <TextInput 
              placeholder="Colonia" 
              value={formData.colony}
              onChangeText={(text) => handleFormChange('colony', text)}
              style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* postal_code */}
          <View style={tw`mt-4`}>
            <Text style={tw`text-sm text-gray-700`}>Código postal</Text>
            <TextInput 
              placeholder="p. ej., 12345" 
              value={formData.postal_code}
              onChangeText={(text) => handleFormChange('postal_code', text)}
              keyboardType="numeric"
              style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} />
          </View>

          {/* address_reference */}
          {/* Optional fields */}
          <Text style={tw`mt-5 text-base font-bold text-gray-900`}>Campos opcionales</Text>
          <View style={tw`mt-2`}>
            <Text style={tw`text-sm text-gray-700`}>Referencia de la dirección</Text>
            <TextInput 
              placeholder="Referencias o indicaciones adicionales" 
              value={formData.address_reference}
              onChangeText={(text) => handleFormChange('address_reference', text)}
              style={tw`mt-2 border border-gray-300 rounded-md px-3 py-2`} 
              multiline={true}
              textAlignVertical='top'
              numberOfLines={7}/>
          </View>
        </View>
        <View style={tw`w-full h-12 mt-5 flex flex-row justify-center items-center`}>
          <ProjectButton 
            title='Crear cliente y continuar con venta'
            onPress={handleOnRegisterNewClient}
            buttonVariant='success'
            buttonStyle={tw`h-14 rounded flex flex-row basis-1/2  justify-center items-center `}/>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
