// Libraries
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import tw from 'twrnc';
import Icon from 'react-native-vector-icons/FontAwesome';

// Utils
import { IRoute, ICompleteRouteDay } from '../../interfaces/interfaces';

const RouteSelectionCard = ({
    routeName,
    day,
    description,
    onSelectCard,
    route,
    routeDay,
    todayTurn
  }:{
    routeName:string,
    day:string,
    description:string|undefined|null,
    onSelectCard:any,
    route:IRoute,
    routeDay:ICompleteRouteDay,
    todayTurn:boolean
  }) => {
    return (
      <View style={
        tw`my-2 rounded w-11/12 h-auto 
          flex flex-row justify-center items-center text-white
          ${todayTurn ? 'bg-green-700' : 'bg-blue-500'}`
        }>
        <View style={tw`flex flex-row basis-2/6 justify-start items-center ml-2`}>
          <View style={tw`w-full flex flex flex-col items-start justify-start`}>
            <Text style={tw`text-white text-xl`}>{routeName}</Text>
            <Text style={tw`text-white text-xl`}>{day}</Text>
          </View>
        </View>
        <View style={tw`flex flex-row basis-3/6 justify-start`}>
          <Text style={tw`text-white text-base`}>
            {description}
          </Text>
        </View>
        <View style={tw`flex flex-row basis-1/6 justify-end`}>
          <View style={tw`mr-2`}>
            <Pressable
            style={tw`bg-blue-700 px-4 py-3 rounded-full`}
            onPress={() => { onSelectCard(route, routeDay); }}>
              <Icon name="chevron-right" style={tw`text-base text-center`} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

export default RouteSelectionCard;
