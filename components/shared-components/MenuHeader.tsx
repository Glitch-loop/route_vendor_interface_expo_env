// Libraries
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import tw from 'twrnc';


// Redux context
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

// Components
import GoButton from '@/components/shared-components/GoButton';
import BluetoothButton from '@/components/bluetooth/BluetoothButton';
import { capitalizeFirstLetter, capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';

// DTOs
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import DayOperationDTO from '@/src/application/dto/DayOperationDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';

const MenuHeader = ({
    showGoBackButton = true,
    showPrinterButton = true,
    id_store = undefined,
    onGoBack,
  }:{
    showGoBackButton?: boolean,
    showPrinterButton?: boolean,
    id_store?: string,
    onGoBack: () => void,
  }) => {
  // Redux (context definitions)
  const workdayInformation: WorkDayInformationDTO | null = useSelector((state: RootState) => state.workDayInformation);
  const stores: StoreDTO[] | null = useSelector((state: RootState) => state.stores);

  let storeName: string = "";
  let routeName: string = "Ruta";

  if (stores !== null) storeName = stores.find(store => store.id_store === id_store)?.store_name || "";
  
  if (workdayInformation !== null) routeName = workdayInformation.route_name;

  return (
    <View 
    // style={tw`flex flex-row items-center ${getJustifyContentConfiguration(showGoBackButton, showRouteName, showStoreName, showPrinterButton)}`}
    style={tw`w-11/12 flex flex-row items-center justify-center`}>

      { showGoBackButton && 
        <View style={tw`basis-1/6`}>
          <GoButton iconName={'chevron-left'} onPressButton={onGoBack}/> 
        </View>
      }
      <View style={tw`basis-4/6 mx-3`}>
        <ScrollView
          showsHorizontalScrollIndicator={true}
          persistentScrollbar={true}
          horizontal={true}>
          { id_store === undefined ?
            <View style={tw`flex flex-col items-start justify-center`}>
              <Text style={tw`text-2xl text-black align-middle`}>{ capitalizeFirstLetter(routeName) }</Text>
            </View>
            :
            <View style={tw`flex flex-col items-start justify-center`}>
              <Text style={tw`text-lg font-bold text-black text-start align-middle`}>{ capitalizeFirstLetterOfEachWord(storeName) }</Text>    
              <Text style={tw`text-base text-black text-start align-middle`}>{ capitalizeFirstLetter(routeName) }</Text>
            </View>
          }
        </ScrollView>
      </View>
      { showPrinterButton && 
        <View style={tw`basis-1/6`}>
          <BluetoothButton /> 
        </View>
      }
    </View>
  );
};

export default MenuHeader;
