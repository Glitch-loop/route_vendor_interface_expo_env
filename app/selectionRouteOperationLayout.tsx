// Libraries
import React from 'react';
import { Router, useRouter } from 'expo-router';
import { Pressable, View, Text } from 'react-native';
import tw from 'twrnc';

// Components
// import RouteHeader from '../components/RouteHeader';
import RouteHeader from '@/components/RouteHeader';

const selectionRouteOperationLayout = () => {
  //Router
  const router:Router = useRouter()

  // Handlers
  const handlerGoBack = () => {
    router.push('/routeSelectionLayout');
  };

  const handlerGoToInventory = () => {
    router.push('/inventoryOperationLayout');
  };

  return (
    <View style={tw`w-full h-full flex flex-col items-center`}>
      <View style={tw`mt-3 w-full`}>
        <RouteHeader
          onGoBack={handlerGoBack}/>
      </View>
      <View style={tw`w-full h-full flex flex-row items-center justify-center`}>
        <Pressable
        style={tw`bg-indigo-300 mr-3 w-52 h-44 rounded-full flex flex-row justify-center items-center  max-w-44`}
        onPress={() => handlerGoToInventory()}>
          <Text style={tw`text-2xl text-center text-white`}>
            Auto registro de inventario.
          </Text>
        </Pressable>
        <Pressable style={tw`bg-indigo-200 w-52 h-44 rounded-full flex flex-row justify-center items-center max-w-44`}>
          <Text style={tw`text-2xl text-center text-white`}>
            Registro de inventario por administrador.
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

export default selectionRouteOperationLayout;
