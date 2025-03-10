// Libraries
import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

// Components
import GoButton from './generalComponents/GoButton';
import { capitalizeFirstLetter, capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';


const RouteCard = (
  {
    itemOrder,
    itemName,
    description,
    totalValue,
    style,
    onSelectItem,
  }:
  {
    itemOrder:string,
    itemName:string,
    description:string,
    totalValue:string,
    style:string,
    onSelectItem:any
  }) => {
    return (
      <View style={tw`${style}`}>
        <View style={tw`flex basis-2/12 flex-col items-center`}>
          <Text style={tw`text-black text-lg text-center`}>{itemOrder}</Text>
        </View>
        { description ?
          <View style={tw`flex basis-8/12 flex-col justify-start`}>
            <Text style={tw`text-black text-lg`} numberOfLines={1} ellipsizeMode="head">
              {capitalizeFirstLetterOfEachWord(itemName)}
            </Text>
            <Text style={tw`text-black text-xs`}>{capitalizeFirstLetterOfEachWord(description)}</Text>
          </View> :
          <View style={tw`flex basis-8/12 flex-col justify-start`}>
            <Text style={tw`text-black text-lg`}>{capitalizeFirstLetterOfEachWord(itemName)}</Text>
          </View>
        }
        {/* <View style={tw`flex basis-1/6 flex-col justify-center`}>
          {totalValue &&
            <Text style={tw`text-black text-lg`}>
              ${totalValue}
            </Text>
          }
        </View> */}
        <View style={tw`w-full flex basis-2/12 flex-row justify-center items-center`}>
          <GoButton
            iconName={'chevron-right'}
            onPressButton={onSelectItem}/>
        </View>
      </View>
    );
  };

export default RouteCard;
