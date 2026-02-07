// Libraries
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

// Utils
import { format_date_to_UI_format } from '../../utils/date/momentFormat';
import DAYS from '../../lib/days';
import { capitalizeFirstLetter } from '../../utils/generalFunctions';

// Redux context
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

// Components
import GoButton from './GoButton';
import BluetoothButton from '../bluetooth/BluetoothButton';
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import { DAYS_ARRAY } from '@/src/core/constants/Days';

const RouteHeader = ({onGoBack}:{onGoBack:any}) => {
  let routeName:string = 'Ruta';
  let startDate:string = new Date().toISOString();
  let dayName:string = '';
  
  // Redux (context definitions)
  const workdayInformation: WorkDayInformationDTO | null = useSelector((state: RootState) => state.workDayInformation);
  const routeSelected = useSelector((state: RootState) => state.route);
  const routeDaySelected = useSelector((state: RootState) => state.routeDay);

  if (workdayInformation !== null) {
    startDate = workdayInformation.start_date;
  }

  if (workdayInformation !== null) {
    routeName = workdayInformation.route_name;
  } else if (routeSelected !== null) {
    routeName = routeSelected.route_name;
  } else {
    routeName = 'Ruta';
  }

  if (workdayInformation !== null) {
    DAYS_ARRAY.find((day) => day.id_day === workdayInformation.id_day)?.day_name
  } else if (routeDaySelected !== null) {
    dayName = DAYS_ARRAY.find((day) => day.id_day === routeDaySelected.id_day)?.day_name || '';
  } else {
    dayName = '';
  }


  // TODO: Refactor component header
  return (
    <View style={tw`w-full flex flex-row justify-around text-center items-center`}>
      <GoButton
        iconName={'chevron-left'}
        onPressButton={onGoBack}/>
      <Text style={tw`text-xl text-black`}>{capitalizeFirstLetter(routeName)}</Text>
      <Text style={tw`text-xl text-black`}>|</Text>
      <View style={tw`flex flex-col`}>
        <Text style={tw`text-base text-black text-center`}>{format_date_to_UI_format(startDate)}</Text>
        <Text style={tw`text-base text-black text-center`}>{capitalizeFirstLetter(dayName)}</Text>
        
      </View>
      <BluetoothButton />
    </View>
  );
};

export default RouteHeader;
