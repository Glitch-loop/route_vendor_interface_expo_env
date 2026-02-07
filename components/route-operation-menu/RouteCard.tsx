// Libraries
import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import tw from 'twrnc';

// Components
import GoButton from '@/components/shared-components/GoButton';
import { capitalizeFirstLetterOfEachWord } from '@/utils/string/utils';


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
        <View style={tw`basis-8/12`}>
          <View style={tw`flex flex-col justify-center items-start`}>
            <ScrollView
              showsHorizontalScrollIndicator={true}
              persistentScrollbar={true}
              horizontal={true}>
                  <View style={tw`my-2`}>
                    <Text style={tw`text-black text-lg`}>{capitalizeFirstLetterOfEachWord(itemName)}</Text>
                    { description && <Text style={tw`text-black text-xs`}>{capitalizeFirstLetterOfEachWord(description)}</Text> } 
                  </View>
              </ScrollView>
          </View>
        </View>
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
