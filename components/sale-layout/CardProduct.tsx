// Librarires
import React, { useEffect, useState } from 'react';

// DTOs
import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';
import tw from 'twrnc';

// UI components
import { View, Text, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import ActionButton from '@/components/sale-layout/ActionButton';
import AutomatedCorrectionNumberInput from '@/components/shared-components/AutomatedCorrectionInput';

const CardProduct = ({
    productName,
    price,
    amount,
    subtotal,
    item,
    onChangeAmount,
    onDeleteItem,
  }:{
    productName:string,
    price:number,
    amount:number,
    subtotal:number,
    item: RouteTransactionDescription,
    onChangeAmount:any,
    onDeleteItem: any,
  }) => {

    const [inputValue, setInputValue] = useState(amount.toString());

    useEffect(() => {
      setInputValue(amount.toString());
    },[amount, inputValue]);

  // Handlers
  const handlerManualTextChange = (input:number) => {
    onChangeAmount(item, input);
  };

  const handleOnMinusOne = () => {
    let newValue = item.amount - 1;
    if  (newValue >= 0) {
      onChangeAmount(item, item.amount - 1);
      setInputValue((item.amount - 1).toString());
    }
  };

  const handleOnPlusOne = () => {
    onChangeAmount(item, item.amount + 1);
    setInputValue((item.amount + 1).toString());
  };

  const handleOnDeleteItem = () => {
    onDeleteItem(item);
  };

  return (
    <View style={tw`w-11/12 h-16
      bg-amber-200/75 border-solid border rounded-md
      flex flex-row justify-center items-center
      `}>
      <View style={tw`flex flex-row basis-3/12 justify-center`}>
        <Text style={tw`text-black text-base`}>{productName}</Text>
      </View>
      <View style={tw`flex flex-row basis-2/12 justify-center`}>
        <Text style={tw`text-black text-lg`}>${price}</Text>
      </View>
      <View style={tw`flex flex-row basis-4/12 justify-around items-center`}>
        <ActionButton
          style={'bg-red-600'}
          onClick={handleOnMinusOne}>
          <Icon name="minus" style={tw`text-base text-center`} color="#000"/>
        </ActionButton>
        <View style={tw`w-14`}>
          <AutomatedCorrectionNumberInput
            amount={amount}
            onChangeAmount={handlerManualTextChange}
          />
        </View>
        <ActionButton
          style={'bg-blue-700'}
          onClick={handleOnPlusOne}>
          <Icon name="plus" style={tw`text-base text-center`} color="#000"/>
        </ActionButton>
      </View>
      <View style={tw`flex flex-row basis-3/12 justify-center`}>
        <Text style={tw`text-black text-lg`}>${subtotal}</Text>
      </View>
      <View style={tw`w-full h-full absolute bottom-2 left-2 flex flex-row justify-end items-start`}>
        <View>
          <Pressable
            onPress={() => { handleOnDeleteItem(); }}
            style={tw`bg-red-400 p-2 rounded-full`}>
            <Icon name={'remove'} style={tw`text-white`}/>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

export default CardProduct;
