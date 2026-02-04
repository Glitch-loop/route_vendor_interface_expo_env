// Libraries
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';


// Redux context
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

// Components
import GoButton from '@/components/shared-components/GoButton';
import BluetoothButton from '@/components/bluetooth/BluetoothButton';
import { getColorContextOfStore, getStoreFromContext } from '../../utils/routesFunctions';
import { capitalizeFirstLetter, capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';

// DTOs
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';
import { SafeAreaView } from 'react-native-safe-area-context';

// Auxiliar function
function getJustifyContentConfiguration(showGoBackButton:boolean, showRouteName:boolean, showStoreName:boolean, showPrinterButton:boolean):string {
  let justifyConent = 'justify-around w-full';
  let activeFields = 0;

  if (showGoBackButton) {
    activeFields += 1;
  }

  if (showRouteName) {
    activeFields += 1;
  }

  if (showStoreName) {
    activeFields += 1;
  }

  if (showPrinterButton) {
    activeFields += 1;
  }

  if (activeFields > 1) { // There are more than 1 actived fields
    justifyConent = 'justify-around w-full';
  } else { // There are only 1 field active
    if (showPrinterButton === true) {
      /* Printer button is the only one that is active. */
      justifyConent = 'justify-end mr-3';
    } else {
      /* There is only one item active, and it is not the printer button. */
      justifyConent = 'justify-start ml-3';
    }

  }

  return justifyConent;
}

const MenuHeader = ({
    showGoBackButton = true,
    showRouteName = true,
    showStoreName = true,
    showPrinterButton = true,
    id_store = undefined,
    onGoBack,
  }:{
    showGoBackButton?: boolean,
    showRouteName?: boolean,
    showStoreName?: boolean,
    showPrinterButton?: boolean,
    id_store?: string,
    onGoBack: () => void,
  }) => {
  // Redux (context definitions)
  const workdayInformation: WorkDayInformationDTO | null = useSelector((state: RootState) => state.workDayInformation);
  const dayOperations: DayOperationDTO[] | null = useSelector((state: RootState) => state.dayOperations);
  const stores: StoreDTO[] | null = useSelector((state: RootState) => state.stores);

  let storeName: string = "";

  if (stores !== null) storeName = stores.find(store => store.id_store === id_store)?.store_name || "";
  

  return (
    <View 
    style={tw`flex flex-row items-center ${getJustifyContentConfiguration(showGoBackButton, showRouteName, showStoreName, showPrinterButton)}`}
    >
      { showGoBackButton &&
        <View style={tw`ml-0`}>
          <GoButton
            iconName={'chevron-left'}
            onPressButton={onGoBack}/>
        </View>
      }
      { showRouteName && workdayInformation &&
        <Text style={tw`text-3xl text-black text-center align-middle`}>
          { capitalizeFirstLetter(workdayInformation.route_name) }
        </Text>
      }
      { showRouteName && showStoreName &&
        <Text style={tw`text-2xl text-black text-center align-middle`}>|</Text>
      }
      { showStoreName && stores &&
        <Text style={tw`max-w-25 ml-3 text-lg text-black text-center align-middle`}>
          { capitalizeFirstLetterOfEachWord(storeName) }
        </Text>
      }
      {/* { showStoreName &&
        <View style={tw`${ getColorContextOfStore(store, currentOperation) } rounded-full flex flex-row h-6 w-6`} />
      } */}
      { showPrinterButton &&
        <View style={tw`mr-0`}>
          <BluetoothButton />
        </View>
      }
    </View>
  );
};

export default MenuHeader;
