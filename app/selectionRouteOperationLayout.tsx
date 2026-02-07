// Libraries
import React from 'react';
import { Router, useRouter } from 'expo-router';
import { View } from 'react-native';
import tw from 'twrnc';

// UI
import RouteHeader from '@/components/shared-components/RouteHeader';
import { SafeAreaView } from 'react-native-safe-area-context';

// Utils
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import ProjectButton from '@/components/shared-components/ProjectButton';

const selectionRouteOperationLayout = () => {
  //Router
  const router:Router = useRouter()

  // Handlers
  const handlerGoBack = () => {
    router.push('/routeSelectionLayout');
  };

  const handlerGoToInventory = () => {
    router.push(`/inventoryOperationLayout?id_type_of_operation_search_param=${DAY_OPERATIONS.start_shift_inventory}`);
  };

  return (
    <SafeAreaView>
      <View style={tw`w-full h-full flex flex-col items-center`}>
        <View style={tw`mt-3 w-full`}>
          <RouteHeader
            onGoBack={handlerGoBack}/>
        </View>
        <View style={tw`w-full h-full flex flex-row items-center justify-center`}>
          <ProjectButton 
            title={'Auto registro de inventario'}
            onPress={handlerGoToInventory}
            buttonVariant={'indigo'}
            textStyle='text-2xl text-center text-white'
            buttonStyle={tw`mr-3 w-52 h-44 rounded-full flex flex-row justify-center items-center  max-w-44`}
          />
          <ProjectButton 
            title={'Registro de inventario por administrador.'}
            onPress={() => {}}
            buttonVariant={'purple'}
            textStyle='text-2xl text-center text-white'
            buttonStyle={tw`mr-3 w-52 h-44 rounded-full flex flex-row justify-center items-center  max-w-44`}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default selectionRouteOperationLayout;
