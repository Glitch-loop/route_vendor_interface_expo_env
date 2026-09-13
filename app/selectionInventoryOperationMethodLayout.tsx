// Libraries
import tw from 'twrnc';
import React from 'react';
import { View } from 'react-native';
import { Href, Router, useLocalSearchParams, useRouter } from 'expo-router';

// UI
import { SafeAreaView } from 'react-native-safe-area-context';
import RouteHeader from '@/components/shared-components/RouteHeader';

// Utils
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import ProjectButton from '@/components/shared-components/ProjectButton';


/*
  id_inventory_operation params is necessary because each time the user
  will start an inventory operation the application asks for the method
  to be used.

  In this way, when the user wants to start an inventory operation from 
  another, it is necessary to pass the id of the inventory operation.
*/
type typeParams = {
  inventory_operation_type: string;
  id_inventory_operation?: string
}

const selectionInventoryOperationMethodLayout = () => {
  const params = useLocalSearchParams<typeParams>();

  const {
    inventory_operation_type,
    id_inventory_operation
  } = params as typeParams;

  //Router
  const router:Router = useRouter()

  // Handlers
  const handlerGoBack = () => {
    router.push('/routeSelectionLayout');
  };

  const handlerGoToInventoryWithManualMethod = () => {
    router.push({
      pathname: '/inventoryOperationLayout',
      params: {
        inventory_operation_type,
        id_inventory_operation: id_inventory_operation,
        inventory_operation_method: '1'
      }
    });
  };

  const handlerGoToInventoryWithAdminRegistrationMethod = () => {
    router.push({
      pathname: '/inventoryOperationLayout',
      params: {
        inventory_operation_type,
        id_inventory_operation: id_inventory_operation,
        inventory_operation_method: '2'
      }
    });
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
            onPress={handlerGoToInventoryWithManualMethod}
            buttonVariant={'indigo'}
            textStyle='text-2xl text-center text-white'
            buttonStyle={tw`mr-3 w-52 h-44 rounded-full flex flex-row justify-center items-center  max-w-44`}
          />
          <ProjectButton 
            title={'Registro de inventario por administrador.'}
            onPress={handlerGoToInventoryWithAdminRegistrationMethod}
            buttonVariant={'purple'}
            textStyle='text-2xl text-center text-white'
            buttonStyle={tw`mr-3 w-52 h-44 rounded-full flex flex-row justify-center items-center  max-w-44`}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default selectionInventoryOperationMethodLayout;
