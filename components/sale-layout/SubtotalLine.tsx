// Libraries
import React from 'react';
import { Text, View } from 'react-native';
import tw from 'twrnc';

// Utils
import { formatNumberAsAccountingCurrency } from '@/utils/string/utils';

const SubtotalLine = ({
    description,
    total,
    fontStyle,
  }:{
    description:string,
    total:number,
    fontStyle:string
  }) => {
  return (
    <View style={tw`w-full flex flex-row justify-end`}>
      <View style={tw`flex basis-5/6`}>
        <Text style={tw`text-black text-right ${fontStyle}`}>{description}</Text>
      </View>
      <View style={tw`flex items-center justify-center`}>
        <Text style={tw`text-black ${fontStyle}`}> {formatNumberAsAccountingCurrency(total)}</Text>
      </View>
    </View>
  );
};

export default SubtotalLine;
