// Libraries
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

// Utils
import { format_date_to_UI_format, timesamp_standard_format } from '../utils/date/momentFormat';
import DAYS from '../lib/days';
import { capitalizeFirstLetter } from '../utils/generalFunctions';

// Redux context
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

// Components
import GoButton from './generalComponents/GoButton';
import BluetoothButton from './generalComponents/BluetoothButton';
import WorkDayInformationDTO from '@/src/application/dto/WorkdayInformationDTO';
import { DAYS_ARRAY } from '@/src/core/constants/Days';

const RouteHeader = ({onGoBack}:{onGoBack:any}) => {
  // Redux (context definitions)
  const workdayInformation: WorkDayInformationDTO | null = useSelector((state: RootState) => state.workDayInformation);
  
  // TODO: Refactor component header
  return (
    <View style={tw`w-full flex flex-row justify-around text-center items-center`}>
      <GoButton
        iconName={'chevron-left'}
        onPressButton={onGoBack}/>
      <Text style={tw`text-3xl text-black`}>{capitalizeFirstLetter(workdayInformation?.route_name || '')}</Text>
      <Text style={tw`text-2xl text-black`}>|</Text>
      <View style={tw`flex flex-col`}>
        <Text style={tw`text-base text-black text-center`}>
          { workdayInformation !== null ? format_date_to_UI_format(workdayInformation.start_date) : ''}
        </Text>
        { workdayInformation !== null &&
          <Text style={tw`text-base text-black text-center`}>
            { capitalizeFirstLetter(DAYS_ARRAY.find((day) => day.id_day === workdayInformation.id_day)?.day_name) }
          </Text>
        }
      </View>
      {/* <BluetoothButton /> */}
    </View>
  );
};

export default RouteHeader;
