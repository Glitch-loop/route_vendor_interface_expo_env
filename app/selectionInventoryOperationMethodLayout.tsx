// Libraries
import tw from 'twrnc';
import React from 'react';
import { View, Text } from 'react-native';
import { Router, useLocalSearchParams, useRouter } from 'expo-router';

// UI
import { SafeAreaView } from 'react-native-safe-area-context';
import RouteHeader from '@/components/shared-components/RouteHeader';

// Utils
import { DAY_OPERATIONS } from '@/src/core/enums/DayOperations';
import ProjectButton from '@/components/shared-components/ProjectButton';
import { getTitleDayOperation } from '@/utils/day-operation/utils';


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
        <View style={tw`mt-3 flex basis-1/12 w-full`}>
          <RouteHeader
            onGoBack={handlerGoBack}/>
        </View>
        <View style={tw`flex basis-2/12 flex-col items-center`}>
          <Text style={tw`text-center text-black text-2xl`}>
            { getTitleDayOperation(inventory_operation_type, null) }
          </Text>
          <Text style={tw`mt-3 text-center text-black text-xl`}>
            Escoge el metodo para registro de inventario
          </Text>
        </View>
        <View style={tw`w-full flex basis-9/12 flex-row items-start justify-center`}>
          <ProjectButton 
            title={'Registro manual de inventario.'}
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
