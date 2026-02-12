// Libraries
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

// UI Components
import GoButton from '@/components/shared-components/GoButton';

// DTOs
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';

const RouteSelectionCard = ({
    routeName,
    day,
    description,
    routeDay,
    todayTurn,
    onSelectCard
  }:{
    routeName:string,
    day:string,
    description:string|undefined|null,
    routeDay:RouteDayDTO,
    todayTurn:boolean
    onSelectCard: (routeDaySelected: RouteDayDTO) => void,
  }) => {
    return (
      <View style={
        tw`my-2 rounded w-11/12 h-auto 
          flex flex-row justify-between items-center text-white
          ${todayTurn ? 'bg-green-700' : 'bg-blue-500'}`
        }>
        <View style={tw`flex flex-row justify-start items-center`}>
          <View style={tw`flex flex flex-col items-start justify-start ml-2`}>
            <Text style={tw`text-white text-xl`}>{routeName}</Text>
            <Text style={tw`text-white text-xl`}>{day}</Text>
          </View>
        </View>
        {/* <View style={tw`flex flex-row basis-3/6 justify-start`}>
          <Text style={tw`text-white text-base`}>
            {description}
          </Text>
        </View> */}
        <View style={tw`flex flex-row justify-end items-center mr-2`}>
          <GoButton
            iconName='chevron-right'
            onPressButton={() => { onSelectCard(routeDay); }}/>
        </View>
      </View>
    );
  };

export default RouteSelectionCard;
